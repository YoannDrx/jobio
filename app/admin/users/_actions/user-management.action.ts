"use server";

import type { Stripe } from "stripe";
import { authAction } from "@/lib/actions/safe-actions";
import { Prisma } from "@/generated/prisma";
import { ApplicationError } from "@/lib/errors/application-error";
import { getServerUrl } from "@/lib/server-url";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { z } from "zod";
import { AUTH_PLANS } from "@/lib/auth/stripe/auth-plans";
import { createAdminAuditLog } from "@app/admin/_actions/admin-audit";

const stripeStatusSchema = z.enum([
  "trialing",
  "active",
  "canceled",
  "past_due",
  "unpaid",
  "incomplete",
  "incomplete_expired",
]);

const isMissingTableError = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021";

const ensureAdmin = (role: string | null | undefined) => {
  if (role !== "admin") {
    throw new ApplicationError("Accès administrateur requis");
  }
};

const ensureTargetUserExists = async (
  userId: string,
): Promise<{
  id: string;
  email: string;
  stripeCustomerId: string | null;
}> => {
  const targetUser = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      email: true,
      stripeCustomerId: true,
    },
  });

  if (!targetUser) {
    throw new ApplicationError("Utilisateur introuvable");
  }

  return targetUser;
};

const resolvePlanFromStripeSubscription = (
  subscription: Stripe.Subscription,
  fallbackPlan: string,
) => {
  const metadataPlan = subscription.metadata.plan;
  if (metadataPlan && ["free", "pro", "ultra"].includes(metadataPlan)) {
    return metadataPlan;
  }

  const priceId = subscription.items.data[0]?.price.id;
  if (priceId) {
    const plan = AUTH_PLANS.find(
      (candidate) =>
        candidate.priceId === priceId || candidate.annualDiscountPriceId === priceId,
    );
    if (plan) {
      return plan.name;
    }
  }

  return fallbackPlan;
};

const resolveStripeCustomerId = (
  customer: string | Stripe.Customer | Stripe.DeletedCustomer,
) => (typeof customer === "string" ? customer : customer.id);

const toDateFromUnixSeconds = (value: number | null | undefined) =>
  value ? new Date(value * 1000) : null;

export type AdminUserBillingTimelineItem = {
  id: string;
  source: "stripe" | "admin_audit";
  eventType: string;
  title: string;
  description: string | null;
  occurredAt: Date;
  amount: number | null;
  currency: string | null;
  status: string | null;
  referenceId: string | null;
};

const syncLocalSubscriptionFromStripe = async (params: {
  userId: string;
  stripeSubscription: Stripe.Subscription;
}) => {
  const existing = await prisma.subscription.findUnique({
    where: {
      referenceId: params.userId,
    },
  });

  const plan = resolvePlanFromStripeSubscription(
    params.stripeSubscription,
    existing?.plan ?? "free",
  );

  if (plan === "free") {
    await prisma.subscription.deleteMany({
      where: {
        referenceId: params.userId,
      },
    });

    return {
      plan: "free" as const,
      status: params.stripeSubscription.status,
      cancelAtPeriodEnd: params.stripeSubscription.cancel_at_period_end,
    };
  }

  const synced = await prisma.subscription.upsert({
    where: {
      referenceId: params.userId,
    },
    update: {
      plan,
      status: params.stripeSubscription.status,
      stripeCustomerId: resolveStripeCustomerId(params.stripeSubscription.customer),
      stripeSubscriptionId: params.stripeSubscription.id,
      cancelAtPeriodEnd: params.stripeSubscription.cancel_at_period_end,
      periodStart: toDateFromUnixSeconds(
        params.stripeSubscription.items.data[0]?.current_period_start,
      ),
      periodEnd: toDateFromUnixSeconds(
        params.stripeSubscription.items.data[0]?.current_period_end,
      ),
    },
    create: {
      id: `sub_sync_${Date.now()}_${params.userId.slice(0, 6)}`,
      referenceId: params.userId,
      plan,
      status: params.stripeSubscription.status,
      stripeCustomerId: resolveStripeCustomerId(params.stripeSubscription.customer),
      stripeSubscriptionId: params.stripeSubscription.id,
      cancelAtPeriodEnd: params.stripeSubscription.cancel_at_period_end,
      periodStart: toDateFromUnixSeconds(
        params.stripeSubscription.items.data[0]?.current_period_start,
      ),
      periodEnd: toDateFromUnixSeconds(
        params.stripeSubscription.items.data[0]?.current_period_end,
      ),
    },
  });

  return {
    plan,
    status: synced.status,
    cancelAtPeriodEnd: synced.cancelAtPeriodEnd ?? false,
  };
};

export const updateUserSubscriptionAction = authAction
  .inputSchema(
    z.object({
      userId: z.string().min(1),
      plan: z.enum(["free", "pro", "ultra"]),
      status: stripeStatusSchema.default("active"),
      cancelAtPeriodEnd: z.boolean().default(false),
      periodEnd: z.string().datetime().optional(),
    }),
  )
  .action(async ({ parsedInput, ctx: { user } }) => {
    ensureAdmin(user.role);
    const targetUser = await ensureTargetUserExists(parsedInput.userId);

    if (parsedInput.plan === "free") {
      await prisma.subscription.deleteMany({
        where: {
          referenceId: parsedInput.userId,
        },
      });

      await createAdminAuditLog({
        action: "USER_SUBSCRIPTION_SET_FREE",
        actorUserId: user.id,
        actorEmail: user.email,
        targetUserId: parsedInput.userId,
        targetEmail: targetUser.email,
      });

      return {
        plan: "free" as const,
        status: null,
      };
    }

    const now = new Date();
    const periodEnd = parsedInput.periodEnd
      ? new Date(parsedInput.periodEnd)
      : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const existing = await prisma.subscription.findUnique({
      where: {
        referenceId: parsedInput.userId,
      },
    });

    const subscription = existing
      ? await prisma.subscription.update({
          where: {
            referenceId: parsedInput.userId,
          },
          data: {
            plan: parsedInput.plan,
            status: parsedInput.status,
            cancelAtPeriodEnd: parsedInput.cancelAtPeriodEnd,
            periodStart: now,
            periodEnd,
          },
        })
      : await prisma.subscription.create({
          data: {
            id: `sub_admin_${Date.now()}_${parsedInput.userId.slice(0, 6)}`,
            referenceId: parsedInput.userId,
            plan: parsedInput.plan,
            status: parsedInput.status,
            cancelAtPeriodEnd: parsedInput.cancelAtPeriodEnd,
            periodStart: now,
            periodEnd,
          },
        });

    await createAdminAuditLog({
      action: "USER_SUBSCRIPTION_UPDATED",
      actorUserId: user.id,
      actorEmail: user.email,
      targetUserId: parsedInput.userId,
      targetEmail: targetUser.email,
      metadata: {
        plan: parsedInput.plan,
        status: parsedInput.status,
        cancelAtPeriodEnd: parsedInput.cancelAtPeriodEnd,
        periodEnd: periodEnd.toISOString(),
      },
    });

    return subscription;
  });

export const adjustUserAiCreditsAction = authAction
  .inputSchema(
    z.object({
      userId: z.string().min(1),
      month: z.number().int().min(1).max(12).optional(),
      year: z.number().int().min(2020).max(2100).optional(),
      mode: z.enum(["set", "add"]).default("add"),
      amount: z.number().int().min(0).max(20_000),
      requestsUsed: z.number().int().min(0).max(20_000).optional(),
      reason: z.string().trim().min(6).max(500),
    }),
  )
  .action(async ({ parsedInput, ctx: { user } }) => {
    ensureAdmin(user.role);
    if (parsedInput.mode === "add" && parsedInput.amount < 1) {
      throw new ApplicationError("Le montant à ajouter doit être supérieur à 0");
    }

    const targetUser = await ensureTargetUserExists(parsedInput.userId);
    const now = new Date();
    const month = parsedInput.month ?? now.getMonth() + 1;
    const year = parsedInput.year ?? now.getFullYear();

    const existingQuota = await prisma.aIMonthlyQuota.findUnique({
      where: {
        userId_month_year: {
          userId: parsedInput.userId,
          month,
          year,
        },
      },
    });

    const requestsLimit =
      parsedInput.mode === "set"
        ? parsedInput.amount
        : (existingQuota?.requestsLimit ?? 0) + parsedInput.amount;

    const previousRequestsLimit = existingQuota?.requestsLimit ?? 0;
    const previousRequestsUsed = existingQuota?.requestsUsed ?? 0;
    const nextRequestsUsed =
      parsedInput.requestsUsed ?? previousRequestsUsed;

    const quota = await prisma.aIMonthlyQuota.upsert({
      where: {
        userId_month_year: {
          userId: parsedInput.userId,
          month,
          year,
        },
      },
      update: {
        requestsLimit,
        requestsUsed: Math.min(nextRequestsUsed, requestsLimit),
      },
      create: {
        userId: parsedInput.userId,
        month,
        year,
        requestsLimit,
        requestsUsed: Math.min(nextRequestsUsed, requestsLimit),
      },
    });

    try {
      await prisma.aIQuotaAdjustment.create({
        data: {
          userId: parsedInput.userId,
          actorUserId: user.id,
          month,
          year,
          mode: parsedInput.mode,
          amount: parsedInput.amount,
          previousRequestsLimit,
          nextRequestsLimit: quota.requestsLimit,
          previousRequestsUsed,
          nextRequestsUsed: quota.requestsUsed,
          reason: parsedInput.reason,
        },
      });
    } catch (error) {
      if (!isMissingTableError(error)) {
        throw error;
      }
    }

    await createAdminAuditLog({
      action: "USER_AI_CREDITS_UPDATED",
      actorUserId: user.id,
      actorEmail: user.email,
      targetUserId: parsedInput.userId,
      targetEmail: targetUser.email,
      metadata: {
        month,
        year,
        mode: parsedInput.mode,
        amount: parsedInput.amount,
        reason: parsedInput.reason,
        previousRequestsLimit,
        requestsLimit: quota.requestsLimit,
        previousRequestsUsed,
        requestsUsed: quota.requestsUsed,
      },
    });

    return quota;
  });

export const createAdminUserNoteAction = authAction
  .inputSchema(
    z.object({
      userId: z.string().min(1),
      content: z.string().trim().min(3).max(2000),
    }),
  )
  .action(async ({ parsedInput, ctx: { user } }) => {
    ensureAdmin(user.role);
    const targetUser = await ensureTargetUserExists(parsedInput.userId);

    const note = await prisma.adminUserNote.create({
      data: {
        userId: parsedInput.userId,
        authorUserId: user.id,
        content: parsedInput.content,
      },
    });

    await createAdminAuditLog({
      action: "USER_NOTE_CREATED",
      actorUserId: user.id,
      actorEmail: user.email,
      targetUserId: parsedInput.userId,
      targetEmail: targetUser.email,
      metadata: {
        noteId: note.id,
      },
    });

    return note;
  });

export const createUserStripePortalAction = authAction
  .inputSchema(
    z.object({
      userId: z.string().min(1),
      returnPath: z.string().min(1).optional(),
    }),
  )
  .action(async ({ parsedInput, ctx: { user } }) => {
    ensureAdmin(user.role);
    const targetUser = await ensureTargetUserExists(parsedInput.userId);

    if (!targetUser.stripeCustomerId) {
      throw new ApplicationError("Aucun customer Stripe lié à cet utilisateur");
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: targetUser.stripeCustomerId,
      return_url: `${getServerUrl()}${
        parsedInput.returnPath ?? `/admin/users/${parsedInput.userId}`
      }`,
    });

    await createAdminAuditLog({
      action: "USER_STRIPE_PORTAL_OPENED",
      actorUserId: user.id,
      actorEmail: user.email,
      targetUserId: parsedInput.userId,
      targetEmail: targetUser.email,
    });

    return {
      url: session.url,
    };
  });

export const syncUserStripeSubscriptionAction = authAction
  .inputSchema(
    z.object({
      userId: z.string().min(1),
    }),
  )
  .action(async ({ parsedInput, ctx: { user } }) => {
    ensureAdmin(user.role);
    const targetUser = await ensureTargetUserExists(parsedInput.userId);

    if (!targetUser.stripeCustomerId) {
      throw new ApplicationError("Aucun customer Stripe lié à cet utilisateur");
    }

    const stripeSubscriptions = await stripe.subscriptions.list({
      customer: targetUser.stripeCustomerId,
      limit: 3,
      status: "all",
    });

    const latest = stripeSubscriptions.data.at(0) ?? null;

    if (!latest) {
      await prisma.subscription.deleteMany({
        where: {
          referenceId: parsedInput.userId,
        },
      });

      await createAdminAuditLog({
        action: "USER_STRIPE_SYNCED_NO_SUBSCRIPTION",
        actorUserId: user.id,
        actorEmail: user.email,
        targetUserId: parsedInput.userId,
        targetEmail: targetUser.email,
      });

      return {
        synced: true,
        hasStripeSubscription: false,
      };
    }

    const syncedSubscription = await syncLocalSubscriptionFromStripe({
      userId: parsedInput.userId,
      stripeSubscription: latest,
    });

    await createAdminAuditLog({
      action: "USER_STRIPE_SYNCED",
      actorUserId: user.id,
      actorEmail: user.email,
      targetUserId: parsedInput.userId,
      targetEmail: targetUser.email,
      metadata: {
        stripeSubscriptionId: latest.id,
        stripeStatus: latest.status,
        plan: syncedSubscription.plan,
      },
    });

    return {
      synced: true,
      hasStripeSubscription: true,
      plan: syncedSubscription.plan,
      status: syncedSubscription.status,
    };
  });

const getVerifiedStripeSubscriptionForUser = async (params: {
  stripeCustomerId: string;
  subscriptionId: string;
}) => {
  const stripeSubscription = await stripe.subscriptions.retrieve(
    params.subscriptionId,
  );
  const stripeCustomerId = resolveStripeCustomerId(stripeSubscription.customer);

  if (stripeCustomerId !== params.stripeCustomerId) {
    throw new ApplicationError(
      "Cet abonnement Stripe n'appartient pas à cet utilisateur",
    );
  }

  return stripeSubscription;
};

const resolveStripeInvoiceCustomerId = (
  customer: string | Stripe.Customer | Stripe.DeletedCustomer | null,
) => {
  if (!customer) return null;
  return typeof customer === "string" ? customer : customer.id;
};

const getVerifiedStripeInvoiceForUser = async (params: {
  stripeCustomerId: string;
  invoiceId: string;
}) => {
  const invoice = await stripe.invoices.retrieve(params.invoiceId, {
    expand: ["payments.data.payment.payment_intent"],
  });
  const customerId = resolveStripeInvoiceCustomerId(invoice.customer);

  if (!customerId || customerId !== params.stripeCustomerId) {
    throw new ApplicationError(
      "Cette facture Stripe n'appartient pas à cet utilisateur",
    );
  }

  return invoice;
};

const getInvoicePaymentIntentId = (
  invoice: Stripe.Invoice | Stripe.Response<Stripe.Invoice>,
) => {
  const invoicePayments = invoice.payments?.data ?? [];

  for (const invoicePayment of invoicePayments) {
    const paymentIntent = invoicePayment.payment.payment_intent;
    if (typeof paymentIntent === "string") {
      return paymentIntent;
    }
    if (paymentIntent?.id) {
      return paymentIntent.id;
    }
  }

  return null;
};

const BILLING_AUDIT_ACTIONS = [
  "USER_STRIPE_PORTAL_OPENED",
  "USER_STRIPE_SYNCED",
  "USER_STRIPE_SYNCED_NO_SUBSCRIPTION",
  "USER_STRIPE_SUBSCRIPTION_CANCELED_IMMEDIATE",
  "USER_STRIPE_SUBSCRIPTION_CANCELED_AT_PERIOD_END",
  "USER_STRIPE_SUBSCRIPTION_RESUMED",
  "USER_STRIPE_INVOICE_REFUNDED",
  "USER_STRIPE_INVOICE_VOIDED",
  "USER_STRIPE_INVOICE_RESENT",
  "USER_SUBSCRIPTION_UPDATED",
  "USER_SUBSCRIPTION_SET_FREE",
] as const;

const BILLING_AUDIT_LABELS: Partial<
  Record<(typeof BILLING_AUDIT_ACTIONS)[number], string>
> = {
    USER_STRIPE_PORTAL_OPENED: "Portail Stripe ouvert",
    USER_STRIPE_SYNCED: "Synchronisation Stripe",
    USER_STRIPE_SYNCED_NO_SUBSCRIPTION: "Synchronisation Stripe (aucun abonnement)",
    USER_STRIPE_SUBSCRIPTION_CANCELED_IMMEDIATE:
      "Abonnement Stripe annulé immédiatement",
    USER_STRIPE_SUBSCRIPTION_CANCELED_AT_PERIOD_END:
      "Abonnement Stripe annulé en fin de période",
    USER_STRIPE_SUBSCRIPTION_RESUMED: "Renouvellement Stripe réactivé",
    USER_STRIPE_INVOICE_REFUNDED: "Remboursement Stripe effectué",
    USER_STRIPE_INVOICE_VOIDED: "Facture Stripe void",
    USER_STRIPE_INVOICE_RESENT: "Facture Stripe renvoyée",
    USER_SUBSCRIPTION_UPDATED: "Abonnement local mis à jour",
    USER_SUBSCRIPTION_SET_FREE: "Abonnement local repassé en free",
};

const fromStripeTimestamp = (value: number | null | undefined) =>
  value ? new Date(value * 1000) : null;

export const cancelUserStripeSubscriptionAction = authAction
  .inputSchema(
    z.object({
      userId: z.string().min(1),
      subscriptionId: z.string().min(1),
      mode: z.enum(["period_end", "immediate"]).default("period_end"),
      adminReason: z.string().trim().min(6).max(500),
    }),
  )
  .action(async ({ parsedInput, ctx: { user } }) => {
    ensureAdmin(user.role);
    const targetUser = await ensureTargetUserExists(parsedInput.userId);

    if (!targetUser.stripeCustomerId) {
      throw new ApplicationError("Aucun customer Stripe lié à cet utilisateur");
    }

    const existingSubscription = await getVerifiedStripeSubscriptionForUser({
      stripeCustomerId: targetUser.stripeCustomerId,
      subscriptionId: parsedInput.subscriptionId,
    });

    const updatedSubscription =
      parsedInput.mode === "immediate"
        ? await stripe.subscriptions.cancel(existingSubscription.id)
        : await stripe.subscriptions.update(existingSubscription.id, {
            cancel_at_period_end: true,
          });

    const syncedSubscription = await syncLocalSubscriptionFromStripe({
      userId: parsedInput.userId,
      stripeSubscription: updatedSubscription,
    });

    await createAdminAuditLog({
      action:
        parsedInput.mode === "immediate"
          ? "USER_STRIPE_SUBSCRIPTION_CANCELED_IMMEDIATE"
          : "USER_STRIPE_SUBSCRIPTION_CANCELED_AT_PERIOD_END",
      actorUserId: user.id,
      actorEmail: user.email,
      targetUserId: parsedInput.userId,
      targetEmail: targetUser.email,
      metadata: {
        subscriptionId: updatedSubscription.id,
        mode: parsedInput.mode,
        status: updatedSubscription.status,
        cancelAtPeriodEnd: updatedSubscription.cancel_at_period_end,
        localPlan: syncedSubscription.plan,
        adminReason: parsedInput.adminReason,
      },
    });

    return {
      subscriptionId: updatedSubscription.id,
      status: updatedSubscription.status,
      cancelAtPeriodEnd: updatedSubscription.cancel_at_period_end,
      plan: syncedSubscription.plan,
    };
  });

export const resumeUserStripeSubscriptionAction = authAction
  .inputSchema(
    z.object({
      userId: z.string().min(1),
      subscriptionId: z.string().min(1),
      adminReason: z.string().trim().min(6).max(500),
    }),
  )
  .action(async ({ parsedInput, ctx: { user } }) => {
    ensureAdmin(user.role);
    const targetUser = await ensureTargetUserExists(parsedInput.userId);

    if (!targetUser.stripeCustomerId) {
      throw new ApplicationError("Aucun customer Stripe lié à cet utilisateur");
    }

    const existingSubscription = await getVerifiedStripeSubscriptionForUser({
      stripeCustomerId: targetUser.stripeCustomerId,
      subscriptionId: parsedInput.subscriptionId,
    });

    if (existingSubscription.status === "canceled") {
      throw new ApplicationError(
        "Impossible de reprendre un abonnement déjà annulé",
      );
    }

    const updatedSubscription = await stripe.subscriptions.update(
      existingSubscription.id,
      {
        cancel_at_period_end: false,
      },
    );

    const syncedSubscription = await syncLocalSubscriptionFromStripe({
      userId: parsedInput.userId,
      stripeSubscription: updatedSubscription,
    });

    await createAdminAuditLog({
      action: "USER_STRIPE_SUBSCRIPTION_RESUMED",
      actorUserId: user.id,
      actorEmail: user.email,
      targetUserId: parsedInput.userId,
      targetEmail: targetUser.email,
      metadata: {
        subscriptionId: updatedSubscription.id,
        status: updatedSubscription.status,
        cancelAtPeriodEnd: updatedSubscription.cancel_at_period_end,
        localPlan: syncedSubscription.plan,
        adminReason: parsedInput.adminReason,
      },
    });

    return {
      subscriptionId: updatedSubscription.id,
      status: updatedSubscription.status,
      cancelAtPeriodEnd: updatedSubscription.cancel_at_period_end,
      plan: syncedSubscription.plan,
    };
  });

export const refundUserStripeInvoiceAction = authAction
  .inputSchema(
    z.object({
      userId: z.string().min(1),
      invoiceId: z.string().min(1),
      mode: z.enum(["full", "partial"]).default("full"),
      amount: z.number().int().min(1).optional(),
      stripeReason: z
        .enum(["duplicate", "fraudulent", "requested_by_customer"])
        .default("requested_by_customer"),
      adminReason: z.string().trim().min(6).max(500),
    }),
  )
  .action(async ({ parsedInput, ctx: { user } }) => {
    ensureAdmin(user.role);
    const targetUser = await ensureTargetUserExists(parsedInput.userId);

    if (!targetUser.stripeCustomerId) {
      throw new ApplicationError("Aucun customer Stripe lié à cet utilisateur");
    }

    const invoice = await getVerifiedStripeInvoiceForUser({
      stripeCustomerId: targetUser.stripeCustomerId,
      invoiceId: parsedInput.invoiceId,
    });

    const paymentIntentId = getInvoicePaymentIntentId(invoice);

    if (!paymentIntentId) {
      throw new ApplicationError(
        "Aucun payment intent trouvé pour cette facture",
      );
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
      expand: ["latest_charge"],
    });

    const latestCharge =
      typeof paymentIntent.latest_charge === "string"
        ? await stripe.charges.retrieve(paymentIntent.latest_charge)
        : paymentIntent.latest_charge;

    const amountReceived = paymentIntent.amount_received;
    const amountRefunded = latestCharge?.amount_refunded ?? 0;
    const refundableAmount = Math.max(0, amountReceived - amountRefunded);

    if (refundableAmount <= 0) {
      throw new ApplicationError("Aucun montant remboursable pour cette facture");
    }

    const amountToRefund =
      parsedInput.mode === "full"
        ? refundableAmount
        : (() => {
            const requestedAmount = parsedInput.amount ?? 0;
            if (requestedAmount <= 0) {
              throw new ApplicationError(
                "Montant partiel requis pour un remboursement partiel",
              );
            }
            if (requestedAmount > refundableAmount) {
              throw new ApplicationError(
                "Le montant dépasse le restant remboursable",
              );
            }
            return requestedAmount;
          })();

    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amountToRefund,
      reason: parsedInput.stripeReason,
      metadata: {
        admin_user_id: user.id,
        target_user_id: parsedInput.userId,
        invoice_id: invoice.id,
      },
    });

    await createAdminAuditLog({
      action: "USER_STRIPE_INVOICE_REFUNDED",
      actorUserId: user.id,
      actorEmail: user.email,
      targetUserId: parsedInput.userId,
      targetEmail: targetUser.email,
      metadata: {
        invoiceId: invoice.id,
        paymentIntentId,
        mode: parsedInput.mode,
        amount: amountToRefund,
        currency: invoice.currency,
        stripeReason: parsedInput.stripeReason,
        adminReason: parsedInput.adminReason,
        refundId: refund.id,
      },
    });

    return {
      refundId: refund.id,
      invoiceId: invoice.id,
      amount: amountToRefund,
      currency: invoice.currency,
      status: refund.status,
    };
  });

export const voidUserStripeInvoiceAction = authAction
  .inputSchema(
    z.object({
      userId: z.string().min(1),
      invoiceId: z.string().min(1),
      adminReason: z.string().trim().min(6).max(500),
    }),
  )
  .action(async ({ parsedInput, ctx: { user } }) => {
    ensureAdmin(user.role);
    const targetUser = await ensureTargetUserExists(parsedInput.userId);

    if (!targetUser.stripeCustomerId) {
      throw new ApplicationError("Aucun customer Stripe lié à cet utilisateur");
    }

    const invoice = await getVerifiedStripeInvoiceForUser({
      stripeCustomerId: targetUser.stripeCustomerId,
      invoiceId: parsedInput.invoiceId,
    });

    if (invoice.status === "paid") {
      throw new ApplicationError("Une facture payée ne peut pas être void");
    }

    const voided = await stripe.invoices.voidInvoice(invoice.id);

    await createAdminAuditLog({
      action: "USER_STRIPE_INVOICE_VOIDED",
      actorUserId: user.id,
      actorEmail: user.email,
      targetUserId: parsedInput.userId,
      targetEmail: targetUser.email,
      metadata: {
        invoiceId: invoice.id,
        previousStatus: invoice.status,
        nextStatus: voided.status,
        adminReason: parsedInput.adminReason,
      },
    });

    return {
      invoiceId: voided.id,
      status: voided.status,
    };
  });

export const resendUserStripeInvoiceAction = authAction
  .inputSchema(
    z.object({
      userId: z.string().min(1),
      invoiceId: z.string().min(1),
      adminReason: z.string().trim().min(6).max(500),
    }),
  )
  .action(async ({ parsedInput, ctx: { user } }) => {
    ensureAdmin(user.role);
    const targetUser = await ensureTargetUserExists(parsedInput.userId);

    if (!targetUser.stripeCustomerId) {
      throw new ApplicationError("Aucun customer Stripe lié à cet utilisateur");
    }

    const invoice = await getVerifiedStripeInvoiceForUser({
      stripeCustomerId: targetUser.stripeCustomerId,
      invoiceId: parsedInput.invoiceId,
    });

    const resentInvoice = await stripe.invoices.sendInvoice(invoice.id);

    await createAdminAuditLog({
      action: "USER_STRIPE_INVOICE_RESENT",
      actorUserId: user.id,
      actorEmail: user.email,
      targetUserId: parsedInput.userId,
      targetEmail: targetUser.email,
      metadata: {
        invoiceId: invoice.id,
        previousStatus: invoice.status,
        nextStatus: resentInvoice.status,
        adminReason: parsedInput.adminReason,
      },
    });

    return {
      invoiceId: resentInvoice.id,
      status: resentInvoice.status,
      hostedInvoiceUrl: resentInvoice.hosted_invoice_url,
    };
  });

export const getAdminUserNotes = async (userId: string, limit = 20) => {
  try {
    return await prisma.adminUserNote.findMany({
      where: {
        userId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });
  } catch (error) {
    if (isMissingTableError(error)) {
      return [];
    }
    throw error;
  }
};

export const getAdminUserAiCreditAdjustments = async (
  userId: string,
  limit = 20,
) => {
  try {
    return await prisma.aIQuotaAdjustment.findMany({
      where: {
        userId,
      },
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });
  } catch (error) {
    if (isMissingTableError(error)) {
      return [];
    }
    throw error;
  }
};

export const getAdminUserBillingSnapshot = async (userId: string) => {
  const targetUser = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      email: true,
      stripeCustomerId: true,
      subscription: true,
    },
  });

  if (!targetUser) {
    throw new ApplicationError("Utilisateur introuvable");
  }

  const response = {
    stripeCustomerId: targetUser.stripeCustomerId,
    localSubscription: targetUser.subscription,
    invoices: [] as {
      id: string;
      status: string | null;
      total: number;
      amountPaid: number;
      amountRemaining: number;
      currency: string;
      paymentIntentId: string | null;
      collectionMethod: string | null;
      hostedInvoiceUrl: string | null;
      createdAt: Date;
      paidAt: Date | null;
    }[],
    stripeSubscriptions: [] as {
      id: string;
      status: string;
      cancelAtPeriodEnd: boolean;
      currentPeriodStart: Date | null;
      currentPeriodEnd: Date | null;
    }[],
    stripeError: null as string | null,
  };

  if (!targetUser.stripeCustomerId) {
    return response;
  }

  try {
    const [invoices, subscriptions] = await Promise.all([
      stripe.invoices.list({
        customer: targetUser.stripeCustomerId,
        limit: 8,
      }),
      stripe.subscriptions.list({
        customer: targetUser.stripeCustomerId,
        limit: 5,
        status: "all",
      }),
    ]);

    response.invoices = invoices.data.map((invoice) => ({
      id: invoice.id,
      status: invoice.status,
      total: invoice.total,
      amountPaid: invoice.amount_paid,
      amountRemaining: invoice.amount_remaining,
      currency: invoice.currency,
      paymentIntentId: getInvoicePaymentIntentId(invoice),
      collectionMethod: invoice.collection_method,
      hostedInvoiceUrl: invoice.hosted_invoice_url ?? null,
      createdAt: new Date(invoice.created * 1000),
      paidAt: invoice.status_transitions.paid_at
        ? new Date(invoice.status_transitions.paid_at * 1000)
        : null,
    }));

    response.stripeSubscriptions = subscriptions.data.map((subscription) => ({
      id: subscription.id,
      status: subscription.status,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      currentPeriodStart: subscription.items.data[0]?.current_period_start
        ? new Date(subscription.items.data[0].current_period_start * 1000)
        : null,
      currentPeriodEnd: subscription.items.data[0]?.current_period_end
        ? new Date(subscription.items.data[0].current_period_end * 1000)
        : null,
    }));

    return response;
  } catch (error) {
    return {
      ...response,
      stripeError:
        error instanceof Error ? error.message : "Erreur Stripe inconnue",
    };
  }
};

export const getAdminUserBillingTimeline = async (
  userId: string,
  limit = 60,
): Promise<AdminUserBillingTimelineItem[]> => {
  const safeLimit = Math.max(1, Math.min(limit, 200));
  const targetUser = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      stripeCustomerId: true,
    },
  });

  if (!targetUser) {
    throw new ApplicationError("Utilisateur introuvable");
  }

  const adminBillingEvents = await (async () => {
    try {
      const logs = await prisma.adminAuditLog.findMany({
        where: {
          targetUserId: userId,
          action: {
            in: [...BILLING_AUDIT_ACTIONS],
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: Math.max(40, safeLimit),
      });

      return logs.map((log) => {
        const metadata =
          log.metadata &&
          typeof log.metadata === "object" &&
          !Array.isArray(log.metadata)
            ? (log.metadata as Record<string, unknown>)
            : null;

        const reason = (() => {
          const adminReason = metadata?.adminReason;
          if (typeof adminReason === "string") {
            return adminReason;
          }
          const genericReason = metadata?.reason;
          return typeof genericReason === "string" ? genericReason : null;
        })();

        const referenceId = (() => {
          const candidates = [
            metadata?.invoiceId,
            metadata?.subscriptionId,
            metadata?.refundId,
            metadata?.stripeSubscriptionId,
          ];
          for (const candidate of candidates) {
            if (typeof candidate === "string" && candidate.length > 0) {
              return candidate;
            }
          }
          return null;
        })();

        const status = (() => {
          const candidates = [metadata?.nextStatus, metadata?.status];
          for (const candidate of candidates) {
            if (typeof candidate === "string" && candidate.length > 0) {
              return candidate;
            }
          }
          return null;
        })();

        return {
          id: `audit:${log.id}`,
          source: "admin_audit" as const,
          eventType: log.action,
          title:
            BILLING_AUDIT_LABELS[
              log.action as (typeof BILLING_AUDIT_ACTIONS)[number]
            ] ?? log.action,
          description: reason,
          occurredAt: log.createdAt,
          amount:
            metadata && typeof metadata.amount === "number"
              ? metadata.amount
              : null,
          currency:
            metadata && typeof metadata.currency === "string"
              ? metadata.currency
              : null,
          status,
          referenceId,
        } satisfies AdminUserBillingTimelineItem;
      });
    } catch (error) {
      if (isMissingTableError(error)) {
        return [] as AdminUserBillingTimelineItem[];
      }
      throw error;
    }
  })();

  if (!targetUser.stripeCustomerId) {
    return adminBillingEvents
      .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime())
      .slice(0, safeLimit);
  }
  const stripeCustomerId = targetUser.stripeCustomerId;

  const stripeEvents = await (async () => {
    try {
      const [invoices, subscriptions] = await Promise.all([
        stripe.invoices.list({
          customer: stripeCustomerId,
          limit: 20,
        }),
        stripe.subscriptions.list({
          customer: stripeCustomerId,
          limit: 10,
          status: "all",
        }),
      ]);

      const invoiceEvents = invoices.data.flatMap((invoice) => {
        const entries: AdminUserBillingTimelineItem[] = [
          {
            id: `stripe:${invoice.id}:created`,
            source: "stripe",
            eventType: "INVOICE_CREATED",
            title: "Facture Stripe créée",
            description: invoice.number
              ? `Facture ${invoice.number}`
              : "Nouvelle facture Stripe",
            occurredAt: new Date(invoice.created * 1000),
            amount: invoice.total,
            currency: invoice.currency,
            status: invoice.status,
            referenceId: invoice.id,
          },
        ];

        const transitions = [
          {
            idSuffix: "finalized",
            timestamp: invoice.status_transitions.finalized_at,
            eventType: "INVOICE_FINALIZED",
            title: "Facture finalisée",
          },
          {
            idSuffix: "paid",
            timestamp: invoice.status_transitions.paid_at,
            eventType: "INVOICE_PAID",
            title: "Facture payée",
          },
          {
            idSuffix: "voided",
            timestamp: invoice.status_transitions.voided_at,
            eventType: "INVOICE_VOIDED",
            title: "Facture void",
          },
          {
            idSuffix: "uncollectible",
            timestamp: invoice.status_transitions.marked_uncollectible_at,
            eventType: "INVOICE_UNCOLLECTIBLE",
            title: "Facture marquée irrécouvrable",
          },
        ] as const;

        for (const transition of transitions) {
          const occurredAt = fromStripeTimestamp(transition.timestamp);
          if (!occurredAt) continue;

          entries.push({
            id: `stripe:${invoice.id}:${transition.idSuffix}`,
            source: "stripe",
            eventType: transition.eventType,
            title: transition.title,
            description: invoice.number
              ? `Facture ${invoice.number}`
              : invoice.id,
            occurredAt,
            amount: invoice.total,
            currency: invoice.currency,
            status: invoice.status,
            referenceId: invoice.id,
          });
        }

        return entries;
      });

      const subscriptionEvents = subscriptions.data.flatMap((subscription) => {
        const periodStart = fromStripeTimestamp(
          subscription.items.data[0]?.current_period_start,
        );
        const periodEnd = fromStripeTimestamp(
          subscription.items.data[0]?.current_period_end,
        );
        const createdAt = fromStripeTimestamp(subscription.created) ?? new Date();

        const entries: AdminUserBillingTimelineItem[] = [
          {
            id: `stripe:${subscription.id}:status`,
            source: "stripe",
            eventType: "SUBSCRIPTION_STATUS",
            title: `Abonnement Stripe ${subscription.status}`,
            description:
              periodStart && periodEnd
                ? `Période ${periodStart.toLocaleDateString("fr-FR")} - ${periodEnd.toLocaleDateString("fr-FR")}`
                : "Période non disponible",
            occurredAt: periodStart ?? createdAt,
            amount: null,
            currency: null,
            status: subscription.status,
            referenceId: subscription.id,
          },
        ];

        const cancelAt = fromStripeTimestamp(subscription.cancel_at);
        if (cancelAt && subscription.cancel_at_period_end) {
          entries.push({
            id: `stripe:${subscription.id}:cancel_at`,
            source: "stripe",
            eventType: "SUBSCRIPTION_CANCEL_SCHEDULED",
            title: "Annulation Stripe programmée",
            description: `Annulation prévue le ${cancelAt.toLocaleDateString("fr-FR")}`,
            occurredAt: cancelAt,
            amount: null,
            currency: null,
            status: subscription.status,
            referenceId: subscription.id,
          });
        }

        const canceledAt = fromStripeTimestamp(subscription.canceled_at);
        if (canceledAt) {
          entries.push({
            id: `stripe:${subscription.id}:canceled`,
            source: "stripe",
            eventType: "SUBSCRIPTION_CANCELED",
            title: "Abonnement Stripe annulé",
            description: null,
            occurredAt: canceledAt,
            amount: null,
            currency: null,
            status: subscription.status,
            referenceId: subscription.id,
          });
        }

        return entries;
      });

      return [...invoiceEvents, ...subscriptionEvents];
    } catch (error) {
      return [
        {
          id: `stripe:error:${Date.now()}`,
          source: "stripe",
          eventType: "STRIPE_TIMELINE_ERROR",
          title: "Erreur Stripe timeline",
          description:
            error instanceof Error ? error.message : "Erreur Stripe inconnue",
          occurredAt: new Date(),
          amount: null,
          currency: null,
          status: null,
          referenceId: null,
        } satisfies AdminUserBillingTimelineItem,
      ];
    }
  })();

  return [...stripeEvents, ...adminBillingEvents]
    .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime())
    .slice(0, safeLimit);
};
