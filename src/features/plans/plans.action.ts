"use server";

import { PricingFunnelEventType } from "@/generated/prisma";
import { rateLimitedAuthAction } from "@/lib/actions/safe-actions";
import { AUTH_PLANS } from "@/lib/auth/stripe/auth-plans";
import { linkStripeCustomerToTrialIdentity } from "@/lib/auth/stripe/pro-trial";
import { isPlanAvailableForNewSubscription } from "@/config/product-features";
import { ActionError } from "@/lib/errors/action-error";
import { capturePricingFunnelEvent } from "@/lib/pricing/pricing-funnel-events";
import { prisma } from "@/lib/prisma";
import { getServerUrl } from "@/lib/server-url";
import { stripe } from "@/lib/stripe";
import { JOBIO_PRO_PRODUCT } from "@/lib/stripe/billing-catalog";
import { z } from "zod";

const internalPathSchema = z
  .string()
  .startsWith("/")
  .refine((value) => !value.startsWith("//"), "Invalid internal path");

const getCheckoutSuccessUrl = (path: string) => {
  const separator = path.includes("?") ? "&" : "?";
  return `${getServerUrl()}${path}${separator}session_id={CHECKOUT_SESSION_ID}`;
};

export const upgradeUserAction = rateLimitedAuthAction(
  "stripe-checkout",
  5,
  300,
)
  .inputSchema(
    z.object({
      plan: z.string(),
      annual: z.boolean().default(false),
      successUrl: internalPathSchema,
      cancelUrl: internalPathSchema,
      entryPoint: z.string().min(2).max(64).optional(),
      experimentVariant: z.string().min(2).max(32).optional(),
    }),
  )
  .action(
    async ({
      parsedInput: {
        plan,
        annual,
        successUrl,
        cancelUrl,
        entryPoint,
        experimentVariant,
      },
      ctx: { user },
    }) => {
      // Find the plan
      const authPlan = AUTH_PLANS.find((p) => p.name === plan);
      if (!authPlan) {
        throw new ActionError(`Plan "${plan}" not found`);
      }

      if (!isPlanAvailableForNewSubscription(plan)) {
        throw new ActionError(
          "Ce plan n'est pas disponible à la souscription.",
        );
      }

      // Get the price ID based on annual or monthly
      const priceId = annual
        ? authPlan.annualDiscountPriceId
        : authPlan.priceId;
      if (!priceId) {
        throw new ActionError(`Price ID not found for plan "${plan}"`);
      }

      // Get the full user from database to access stripeCustomerId
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          name: true,
          email: true,
          stripeCustomerId: true,
          subscription: {
            select: {
              plan: true,
            },
          },
        },
      });

      if (!dbUser) {
        throw new ActionError("Utilisateur introuvable");
      }

      const expectedInterval = annual ? "year" : "month";
      const expectedCatalogPrice = annual
        ? JOBIO_PRO_PRODUCT.prices.yearly
        : JOBIO_PRO_PRODUCT.prices.monthly;
      const stripePrice = await stripe.prices.retrieve(priceId);
      if (
        !stripePrice.active ||
        stripePrice.type !== "recurring" ||
        stripePrice.recurring?.interval !== expectedInterval ||
        stripePrice.metadata.plan !== plan ||
        stripePrice.lookup_key !== expectedCatalogPrice.lookupKey ||
        stripePrice.unit_amount !== expectedCatalogPrice.unitAmount ||
        stripePrice.currency !== expectedCatalogPrice.currency ||
        stripePrice.tax_behavior !== "exclusive"
      ) {
        throw new ActionError(
          "Cette offre est temporairement indisponible. Réessaie plus tard.",
        );
      }

      let customerId = dbUser.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create(
          {
            email: dbUser.email,
            name: dbUser.name,
            metadata: {
              app: "jobio",
              userId: user.id,
            },
          },
          {
            idempotencyKey: `jobio-customer-${user.id}`,
          },
        );
        customerId = customer.id;
        await prisma.user.update({
          where: { id: user.id },
          data: { stripeCustomerId: customerId },
        });
      }

      await linkStripeCustomerToTrialIdentity({
        userId: user.id,
        email: dbUser.email,
        stripeCustomerId: customerId,
      });

      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: "all",
        limit: 20,
      });
      const hasCurrentSubscription = subscriptions.data.some((subscription) =>
        ["active", "trialing", "past_due", "unpaid", "paused"].includes(
          subscription.status,
        ),
      );
      if (hasCurrentSubscription) {
        throw new ActionError(
          "Un abonnement existe déjà pour ce compte. Gère-le depuis ton espace abonnement.",
        );
      }

      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: "subscription",
        automatic_tax: { enabled: true },
        billing_address_collection: "required",
        tax_id_collection: { enabled: true },
        customer_update: {
          address: "auto",
          name: "auto",
        },
        custom_text: {
          submit: {
            message:
              "Paiement sécurisé pour Jobio, service édité par Yodev — Yoann Andrieux. Prix hors taxes ; le total est confirmé avant paiement.",
          },
        },
        client_reference_id: user.id,
        success_url: getCheckoutSuccessUrl(successUrl),
        cancel_url: `${getServerUrl()}${cancelUrl}`,
        metadata: {
          userId: user.id,
          plan: plan,
          entryPoint: entryPoint ?? "unknown",
          billingCycle: annual ? "yearly" : "monthly",
          experimentVariant: experimentVariant ?? "control",
        },
        subscription_data: {
          metadata: {
            userId: user.id,
            plan: plan,
            entryPoint: entryPoint ?? "unknown",
            billingCycle: annual ? "yearly" : "monthly",
            experimentVariant: experimentVariant ?? "control",
            catalogVersion: String(JOBIO_PRO_PRODUCT.metadata.catalog_version),
          },
        },
      });

      if (!session.url) {
        throw new ActionError("Impossible d’ouvrir la page de paiement.");
      }

      await capturePricingFunnelEvent({
        eventType: PricingFunnelEventType.CHECKOUT_STARTED,
        userId: user.id,
        planCurrent: dbUser.subscription?.plan ?? "free",
        planTarget: plan,
        billingCycle: annual ? "yearly" : "monthly",
        entryPoint: entryPoint ?? "pricing",
        experimentVariant: experimentVariant ?? "control",
        checkoutSessionId: session.id,
      });

      return {
        url: session.url,
      };
    },
  );
