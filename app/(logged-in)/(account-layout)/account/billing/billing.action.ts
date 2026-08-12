"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { ActionError } from "@/lib/errors/action-error";
import { prisma } from "@/lib/prisma";
import { getServerUrl } from "@/lib/server-url";
import { stripe } from "@/lib/stripe";
import { z } from "zod";

const internalPathSchema = z
  .string()
  .startsWith("/")
  .refine((value) => !value.startsWith("//"), "Invalid internal path");

const getStripeCustomerId = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true },
  });

  if (!user?.stripeCustomerId) {
    throw new ActionError("Aucun compte de facturation Stripe n’est associé.");
  }

  return user.stripeCustomerId;
};

export const openStripePortalAction = authAction.action(
  async ({ ctx: { user } }) => {
    const stripeCustomerId = await getStripeCustomerId(user.id);

    if (!stripeCustomerId) {
      throw new ActionError(
        "Aucun compte de facturation Stripe n’est associé.",
      );
    }

    const stripeBilling = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      configuration: process.env.STRIPE_JOBIO_PORTAL_CONFIGURATION_ID,
      return_url: `${getServerUrl()}/account/billing`,
    });

    if (!stripeBilling.url) {
      throw new ActionError("Impossible d’ouvrir le portail de facturation.");
    }

    return {
      url: stripeBilling.url,
    };
  },
);

export const cancelSubscriptionAction = authAction
  .inputSchema(
    z.object({
      returnUrl: internalPathSchema,
    }),
  )
  .action(async ({ parsedInput: { returnUrl }, ctx: { user } }) => {
    const stripeCustomerId = await getStripeCustomerId(user.id);

    if (!stripeCustomerId) {
      throw new ActionError(
        "Aucun compte de facturation Stripe n’est associé.",
      );
    }

    // Get the current subscription
    const subscription = await prisma.subscription.findFirst({
      where: { referenceId: user.id },
    });

    if (!subscription?.stripeSubscriptionId) {
      throw new ActionError("Aucun abonnement actif n’a été trouvé.");
    }

    // Create billing portal session which allows the user to cancel
    const stripeBilling = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      configuration: process.env.STRIPE_JOBIO_PORTAL_CONFIGURATION_ID,
      return_url: `${getServerUrl()}${returnUrl}`,
    });

    if (!stripeBilling.url) {
      throw new ActionError("Impossible d’ouvrir le portail de facturation.");
    }

    return {
      url: stripeBilling.url,
    };
  });
