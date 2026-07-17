"use server";

import { PricingFunnelEventType } from "@/generated/prisma";
import { authAction } from "@/lib/actions/safe-actions";
import { AUTH_PLANS } from "@/lib/auth/stripe/auth-plans";
import { isPlanAvailableForNewSubscription } from "@/config/product-features";
import { ActionError } from "@/lib/errors/action-error";
import { capturePricingFunnelEvent } from "@/lib/pricing/pricing-funnel-events";
import { prisma } from "@/lib/prisma";
import { getServerUrl } from "@/lib/server-url";
import { stripe } from "@/lib/stripe";
import { z } from "zod";

const internalPathSchema = z
  .string()
  .startsWith("/")
  .refine((value) => !value.startsWith("//"), "Invalid internal path");

const getCheckoutSuccessUrl = (path: string) => {
  const separator = path.includes("?") ? "&" : "?";
  return `${getServerUrl()}${path}${separator}session_id={CHECKOUT_SESSION_ID}`;
};

export const upgradeUserAction = authAction
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
      const stripePrice = await stripe.prices.retrieve(priceId);
      if (
        !stripePrice.active ||
        stripePrice.type !== "recurring" ||
        stripePrice.recurring?.interval !== expectedInterval ||
        stripePrice.metadata.plan !== plan
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
          },
          trial_period_days: authPlan.freeTrial?.days,
        },
      });

      if (!session.url) {
        throw new ActionError("Failed to create checkout session");
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
