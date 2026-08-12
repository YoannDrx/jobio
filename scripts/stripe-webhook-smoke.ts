/* eslint-disable no-console */
import "dotenv/config";
import { PrismaClient } from "@/generated/prisma";
import { resolvePlanLimitsForUser } from "@/lib/auth/stripe/plan-entitlements";
import {
  getProgramCatalogEntry,
  PROGRAM_PRICE,
} from "@/lib/stripe/billing-catalog";
import { upfetch } from "@/lib/up-fetch";
import Stripe from "stripe";
import { z } from "zod";

const prisma = new PrismaClient();
const baseUrl = process.env.STRIPE_SMOKE_BASE_URL ?? "http://localhost:3000";
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

if (!webhookSecret) {
  throw new Error("STRIPE_WEBHOOK_SECRET is required");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "sk_test_smoke", {
  typescript: true,
});
const suffix = `${Date.now()}`;
const userId = `stripe-smoke-user-${suffix}`;
const customerId = `cus_smoke_${suffix}`;
const subscriptionId = `sub_smoke_${suffix}`;
const eventIds: string[] = [];
const now = Math.floor(Date.now() / 1000);

const buildSubscription = (
  status: Stripe.Subscription.Status,
): Stripe.Subscription =>
  ({
    id: subscriptionId,
    object: "subscription",
    customer: customerId,
    status,
    cancel_at_period_end: false,
    metadata: { app: "jobio", plan: "pro", userId },
    items: {
      object: "list",
      data: [
        {
          current_period_start: now,
          current_period_end: now + 30 * 24 * 60 * 60,
          price: {
            id: "price_smoke_pro_monthly",
            recurring: { interval: "month" },
          },
        },
      ],
      has_more: false,
      url: `/v1/subscriptions/${subscriptionId}/items`,
    },
  }) as unknown as Stripe.Subscription;

const sendEvent = async (params: {
  id: string;
  created: number;
  type: Stripe.Event.Type;
  object: unknown;
}) => {
  eventIds.push(params.id);
  const payload = JSON.stringify({
    id: params.id,
    object: "event",
    api_version: "2025-09-30.clover",
    created: params.created,
    data: { object: params.object },
    livemode: false,
    pending_webhooks: 1,
    request: { id: null, idempotency_key: null },
    type: params.type,
  });
  const signature = stripe.webhooks.generateTestHeaderString({
    payload,
    secret: webhookSecret,
  });
  await upfetch(`${baseUrl}/api/webhooks/stripe`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "stripe-signature": signature,
    },
    body: payload,
    schema: z.object({ ok: z.boolean() }).passthrough(),
  });
};

const assertSubscriptionStatus = async (expectedStatus: string) => {
  const subscription = await prisma.subscription.findUnique({
    where: { referenceId: userId },
  });
  if (subscription?.status !== expectedStatus) {
    throw new Error(
      `Expected subscription status ${expectedStatus}, got ${subscription?.status ?? "missing"}`,
    );
  }
};

async function run() {
  await prisma.user.create({
    data: {
      id: userId,
      name: "Stripe Smoke Test",
      email: `stripe-smoke-${suffix}@example.test`,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      preference: { create: { proTrialConsumedAt: new Date() } },
    },
  });

  const createdEvent = {
    id: `evt_smoke_created_${suffix}`,
    created: now,
    type: "customer.subscription.created" as const,
    object: buildSubscription("trialing"),
  };
  await sendEvent(createdEvent);
  await assertSubscriptionStatus("trialing");

  await sendEvent(createdEvent);
  const duplicateCount = await prisma.stripeWebhookEvent.count({
    where: { id: createdEvent.id },
  });
  if (duplicateCount !== 1) {
    throw new Error(`Expected one webhook ledger row, got ${duplicateCount}`);
  }

  await sendEvent({
    id: `evt_smoke_stale_${suffix}`,
    created: now - 60,
    type: "customer.subscription.deleted",
    object: buildSubscription("canceled"),
  });
  await assertSubscriptionStatus("trialing");

  await sendEvent({
    id: `evt_smoke_active_${suffix}`,
    created: now + 60,
    type: "customer.subscription.updated",
    object: buildSubscription("active"),
  });
  await assertSubscriptionStatus("active");

  await sendEvent({
    id: `evt_smoke_deleted_${suffix}`,
    created: now + 120,
    type: "customer.subscription.deleted",
    object: buildSubscription("canceled"),
  });
  await assertSubscriptionStatus("canceled");

  const resolvedPlan = await resolvePlanLimitsForUser(userId);
  if (resolvedPlan.plan !== "free") {
    throw new Error(
      `Canceled subscription still resolves to ${resolvedPlan.plan}`,
    );
  }

  const program = await prisma.linkedInProgram.findFirst({
    where: { isFree: false },
    select: { id: true, slug: true },
  });
  const catalogEntry = program ? getProgramCatalogEntry(program.slug) : null;
  if (!program || !catalogEntry) {
    throw new Error("Paid program catalog is not seeded");
  }
  const programPaymentIntentId = `pi_smoke_program_${suffix}`;
  const programSession = {
    id: `cs_smoke_program_${suffix}`,
    object: "checkout.session",
    mode: "payment",
    payment_status: "paid",
    payment_intent: programPaymentIntentId,
    amount_subtotal: PROGRAM_PRICE.unitAmount,
    amount_total: PROGRAM_PRICE.unitAmount,
    currency: PROGRAM_PRICE.currency,
    metadata: {
      type: "linkedin_program",
      userId,
      programId: program.id,
      slug: program.slug,
      sku: catalogEntry.sku,
    },
  };
  await sendEvent({
    id: `evt_smoke_program_checkout_${suffix}`,
    created: now + 180,
    type: "checkout.session.completed",
    object: programSession,
  });
  const completedPurchase = await prisma.programPurchase.findUnique({
    where: { userId_programId: { userId, programId: program.id } },
  });
  if (completedPurchase?.status !== "completed") {
    throw new Error("Program checkout was not completed");
  }

  await sendEvent({
    id: `evt_smoke_program_refund_${suffix}`,
    created: now + 240,
    type: "charge.refunded",
    object: {
      id: `ch_smoke_program_${suffix}`,
      object: "charge",
      amount: PROGRAM_PRICE.unitAmount,
      amount_refunded: PROGRAM_PRICE.unitAmount,
      refunded: true,
      payment_intent: programPaymentIntentId,
    },
  });
  const refundedPurchase = await prisma.programPurchase.findUnique({
    where: { userId_programId: { userId, programId: program.id } },
  });
  if (refundedPurchase?.status !== "refunded") {
    throw new Error("Program refund did not revoke access");
  }

  console.log(
    "Stripe webhook smoke passed: signature, idempotency, ordering, cancellation, program checkout and refund",
  );
}

run()
  .finally(async () => {
    await prisma.$transaction([
      prisma.user.deleteMany({ where: { id: userId } }),
      prisma.stripeWebhookEvent.deleteMany({ where: { id: { in: eventIds } } }),
    ]);
    await prisma.$disconnect();
  })
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
