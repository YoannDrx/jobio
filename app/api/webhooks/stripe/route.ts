import { PricingFunnelEventType, Prisma } from "@/generated/prisma";
import { AUTH_PLANS, type AppAuthPlan } from "@/lib/auth/stripe/auth-plans";
import { markProTrialConsumed } from "@/lib/auth/stripe/pro-trial";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { capturePricingFunnelEvent } from "@/lib/pricing/pricing-funnel-events";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import {
  getProgramCatalogEntry,
  PROGRAM_PRICE,
} from "@/lib/stripe/billing-catalog";
import {
  isChargeFullyRefunded,
  resolveProgramPurchaseStatus,
  type ProgramPurchaseStatus,
} from "@/lib/stripe/program-purchase-state";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

export const maxDuration = 60;

const MAX_STRIPE_WEBHOOK_BYTES = 1_000_000;

const SUBSCRIPTION_EVENT_TYPES = new Set<Stripe.Event.Type>([
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "checkout.session.async_payment_failed",
  "checkout.session.expired",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "customer.subscription.paused",
  "customer.subscription.resumed",
  "invoice.paid",
  "invoice.payment_failed",
  "invoice.payment_action_required",
  "invoice.finalization_failed",
  "charge.refunded",
]);

type SubscriptionSyncResult = {
  applied: boolean;
  previousStatus: string | null;
  plan: AppAuthPlan;
  referenceId: string;
};

const getPlanFromSubscription = (subscription: Stripe.Subscription) => {
  const planName = subscription.metadata.plan;
  if (!planName) return null;
  return AUTH_PLANS.find((plan) => plan.name === planName) ?? null;
};

const getCustomerId = (subscription: Stripe.Subscription) =>
  typeof subscription.customer === "string"
    ? subscription.customer
    : subscription.customer.id;

const getSubscriptionPeriod = (subscription: Stripe.Subscription) => {
  const item = subscription.items.data.at(0);
  return {
    periodStart: item?.current_period_start
      ? new Date(item.current_period_start * 1000)
      : null,
    periodEnd: item?.current_period_end
      ? new Date(item.current_period_end * 1000)
      : null,
  };
};

const resolveReferenceId = async (subscription: Stripe.Subscription) => {
  const metadataUserId = subscription.metadata.userId;
  if (metadataUserId) {
    const metadataUser = await prisma.user.findUnique({
      where: { id: metadataUserId },
      select: { id: true },
    });
    if (metadataUser) return metadataUser.id;
  }

  const customerId = getCustomerId(subscription);
  const [user, existingSubscription] = await Promise.all([
    prisma.user.findFirst({
      where: { stripeCustomerId: customerId },
      select: { id: true },
    }),
    prisma.subscription.findFirst({
      where: { stripeSubscriptionId: subscription.id },
      select: { referenceId: true },
    }),
  ]);

  return user?.id ?? existingSubscription?.referenceId ?? null;
};

const syncSubscription = async (
  event: Stripe.Event,
  subscription: Stripe.Subscription,
): Promise<SubscriptionSyncResult> => {
  const plan = getPlanFromSubscription(subscription);
  if (!plan) {
    throw new Error(`Unknown plan for Stripe subscription ${subscription.id}`);
  }

  const referenceId = await resolveReferenceId(subscription);
  if (!referenceId) {
    throw new Error(
      `User not found for Stripe subscription ${subscription.id}`,
    );
  }

  const customerId = getCustomerId(subscription);
  const eventCreatedAt = new Date(event.created * 1000);
  const { periodStart, periodEnd } = getSubscriptionPeriod(subscription);

  return prisma.$transaction(async (tx) => {
    const current = await tx.subscription.findUnique({
      where: { referenceId },
    });
    if (
      current?.stripeEventCreatedAt &&
      current.stripeEventCreatedAt > eventCreatedAt
    ) {
      return {
        applied: false,
        previousStatus: current.status,
        plan,
        referenceId,
      };
    }

    await tx.user.update({
      where: { id: referenceId },
      data: { stripeCustomerId: customerId },
    });

    await tx.subscription.upsert({
      where: { referenceId },
      update: {
        plan: plan.name,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscription.id,
        status: subscription.status,
        periodStart,
        periodEnd,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        stripeEventCreatedAt: eventCreatedAt,
      },
      create: {
        id: subscription.id,
        plan: plan.name,
        referenceId,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscription.id,
        status: subscription.status,
        periodStart,
        periodEnd,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        stripeEventCreatedAt: eventCreatedAt,
      },
    });

    return {
      applied: true,
      previousStatus: current?.status ?? null,
      plan,
      referenceId,
    };
  });
};

const processProgramPurchase = async (
  event: Stripe.Event,
  session: Stripe.Checkout.Session,
  status: ProgramPurchaseStatus,
) => {
  const metadata = session.metadata;
  const programId = metadata?.programId;
  const userId = metadata?.userId;
  if (!metadata || !programId || !userId) {
    throw new Error("Missing programId or userId in program purchase metadata");
  }

  const program = await prisma.linkedInProgram.findUnique({
    where: { id: programId },
    select: { slug: true, isFree: true },
  });
  const catalogEntry = program ? getProgramCatalogEntry(program.slug) : null;
  const amountTotal = session.amount_total;
  const currency = session.currency;
  if (
    !program ||
    program.isFree ||
    !catalogEntry ||
    metadata.slug !== program.slug ||
    metadata.sku !== catalogEntry.sku ||
    session.amount_subtotal !== PROGRAM_PRICE.unitAmount ||
    amountTotal === null ||
    currency !== PROGRAM_PRICE.currency
  ) {
    throw new Error(
      `Invalid program catalog metadata for session ${session.id}`,
    );
  }

  const eventCreatedAt = new Date(event.created * 1000);
  await prisma.$transaction(
    async (tx) => {
      const current = await tx.programPurchase.findUnique({
        where: { userId_programId: { userId, programId } },
        select: { status: true, stripeEventCreatedAt: true },
      });
      if (
        current?.stripeEventCreatedAt &&
        (current.stripeEventCreatedAt > eventCreatedAt ||
          (current.stripeEventCreatedAt.getTime() ===
            eventCreatedAt.getTime() &&
            (current.status === "refunded" ||
              (current.status === "completed" && status !== "completed"))))
      ) {
        return;
      }

      await tx.programPurchase.upsert({
        where: { userId_programId: { userId, programId } },
        update: {
          status,
          stripeSessionId: session.id,
          stripePaymentIntentId:
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : (session.payment_intent?.id ?? null),
          stripeEventCreatedAt: eventCreatedAt,
          amount: amountTotal,
          currency,
        },
        create: {
          userId,
          programId,
          status,
          stripeSessionId: session.id,
          stripePaymentIntentId:
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : (session.payment_intent?.id ?? null),
          stripeEventCreatedAt: eventCreatedAt,
          amount: amountTotal,
          currency,
        },
      });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
};

const processCheckoutCompleted = async (
  event: Stripe.Event,
  session: Stripe.Checkout.Session,
) => {
  if (
    session.mode === "payment" &&
    session.metadata?.type === "linkedin_program"
  ) {
    await processProgramPurchase(
      event,
      session,
      resolveProgramPurchaseStatus({
        eventType: event.type as
          | "checkout.session.completed"
          | "checkout.session.async_payment_succeeded"
          | "checkout.session.async_payment_failed"
          | "checkout.session.expired",
        paymentStatus: session.payment_status,
      }),
    );
    return;
  }

  if (event.type !== "checkout.session.completed") {
    return;
  }

  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id;
  if (!subscriptionId) {
    throw new Error(`Subscription missing from checkout session ${session.id}`);
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const result = await syncSubscription(event, subscription);

  if (result.applied && subscription.status === "active") {
    const user = await prisma.user.findUnique({
      where: { id: result.referenceId },
      select: { email: true },
    });
    if (user) {
      await markProTrialConsumed({
        userId: result.referenceId,
        email: user.email,
      });
    }
  }

  if (result.applied) {
    await capturePricingFunnelEvent({
      eventType: PricingFunnelEventType.SUBSCRIPTION_COMPLETED,
      userId: result.referenceId,
      planCurrent: "free",
      planTarget: result.plan.name,
      billingCycle:
        subscription.items.data.at(0)?.price.recurring?.interval === "year"
          ? "yearly"
          : "monthly",
      entryPoint: session.metadata?.entryPoint ?? "stripe_checkout",
      experimentVariant:
        session.metadata?.experimentVariant ??
        subscription.metadata.experimentVariant,
      checkoutSessionId: session.id,
      stripeSubscriptionId: subscription.id,
      metadata: { status: subscription.status },
    }).catch((error: unknown) => {
      logger.error("Unable to record Stripe conversion event", error);
    });
  }
};

const getEventObjectSummary = (event: Stripe.Event) => {
  const object = event.data.object as { id?: string; object?: string };
  return {
    objectId: object.id ?? null,
    payload: {
      object: object.object ?? "unknown",
      objectId: object.id ?? null,
      requestId:
        typeof event.request === "string"
          ? event.request
          : (event.request?.id ?? null),
    } satisfies Prisma.InputJsonValue,
  };
};

const beginWebhookEvent = async (event: Stripe.Event): Promise<boolean> => {
  const existing = await prisma.stripeWebhookEvent.findUnique({
    where: { id: event.id },
    select: { status: true },
  });

  if (existing?.status === "PROCESSED") {
    return false;
  }

  const summary = getEventObjectSummary(event);
  if (existing) {
    await prisma.stripeWebhookEvent.update({
      where: { id: event.id },
      data: {
        status: "PROCESSING",
        attempts: { increment: 1 },
        lastError: null,
        failedAt: null,
        objectId: summary.objectId,
        payload: summary.payload,
      },
    });
    return true;
  }

  try {
    await prisma.stripeWebhookEvent.create({
      data: {
        id: event.id,
        type: event.type,
        livemode: event.livemode,
        status: "PROCESSING",
        objectId: summary.objectId,
        payload: summary.payload,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return false;
    }
    throw error;
  }
  return true;
};

const markWebhookProcessed = async (
  eventId: string,
  businessObjectId?: string | null,
) => {
  await prisma.stripeWebhookEvent.update({
    where: { id: eventId },
    data: {
      status: "PROCESSED",
      processedAt: new Date(),
      businessObjectId: businessObjectId ?? undefined,
      lastError: null,
      failedAt: null,
    },
  });
};

const markWebhookFailed = async (eventId: string, error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown error";
  await prisma.stripeWebhookEvent.update({
    where: { id: eventId },
    data: {
      status: "FAILED",
      lastError: message.slice(0, 2000),
      failedAt: new Date(),
    },
  });
};

type InvoiceWithLegacySubscription = Stripe.Invoice & {
  subscription?: string | Stripe.Subscription | null;
};

const getInvoiceSubscriptionId = (invoice: Stripe.Invoice) => {
  if (invoice.parent?.type === "subscription_details") {
    const subscription = invoice.parent.subscription_details?.subscription;
    return typeof subscription === "string"
      ? subscription
      : (subscription?.id ?? null);
  }

  const legacySubscription = (invoice as InvoiceWithLegacySubscription)
    .subscription;
  return typeof legacySubscription === "string"
    ? legacySubscription
    : (legacySubscription?.id ?? null);
};

const processInvoiceEvent = async (
  event: Stripe.Event,
  invoice: Stripe.Invoice,
) => {
  const subscriptionId = getInvoiceSubscriptionId(invoice);
  if (!subscriptionId) {
    return invoice.id;
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const result = await syncSubscription(event, subscription);
  return result.referenceId;
};

const processProgramRefund = async (
  event: Stripe.Event,
  charge: Stripe.Charge,
) => {
  if (
    !isChargeFullyRefunded({
      amount: charge.amount,
      amountRefunded: charge.amount_refunded,
      refunded: charge.refunded,
    })
  ) {
    return charge.id;
  }

  const paymentIntentId =
    typeof charge.payment_intent === "string"
      ? charge.payment_intent
      : charge.payment_intent?.id;
  if (!paymentIntentId) return charge.id;

  const purchase = await prisma.programPurchase.findFirst({
    where: { stripePaymentIntentId: paymentIntentId },
    select: { id: true },
  });
  if (!purchase) return charge.id;

  const eventCreatedAt = new Date(event.created * 1000);
  await prisma.programPurchase.updateMany({
    where: {
      id: purchase.id,
      OR: [
        { stripeEventCreatedAt: null },
        { stripeEventCreatedAt: { lte: eventCreatedAt } },
      ],
    },
    data: { status: "refunded", stripeEventCreatedAt: eventCreatedAt },
  });
  return purchase.id;
};

export const POST = async (req: NextRequest) => {
  if (!env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "Stripe webhook is not configured" },
      { status: 503 },
    );
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 },
    );
  }

  const declaredLength = Number(req.headers.get("content-length") ?? 0);
  if (
    Number.isFinite(declaredLength) &&
    declaredLength > MAX_STRIPE_WEBHOOK_BYTES
  ) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

  const body = await req.text();
  if (Buffer.byteLength(body, "utf8") > MAX_STRIPE_WEBHOOK_BYTES) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (error) {
    logger.warn("Stripe webhook signature verification failed", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (!SUBSCRIPTION_EVENT_TYPES.has(event.type)) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const shouldProcess = await beginWebhookEvent(event);
  if (!shouldProcess) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  try {
    let businessObjectId: string | null = null;
    if (event.type.startsWith("checkout.session.")) {
      const checkoutSession = event.data.object as Stripe.Checkout.Session;
      await processCheckoutCompleted(event, checkoutSession);
      businessObjectId = checkoutSession.id;
    } else if (event.type.startsWith("customer.subscription.")) {
      const subscription = event.data.object as Stripe.Subscription;
      const result = await syncSubscription(event, subscription);
      businessObjectId = result.referenceId;
    } else if (event.type.startsWith("invoice.")) {
      businessObjectId = await processInvoiceEvent(
        event,
        event.data.object as Stripe.Invoice,
      );
    } else if (event.type === "charge.refunded") {
      businessObjectId = await processProgramRefund(event, event.data.object);
    }

    await markWebhookProcessed(event.id, businessObjectId);
  } catch (error) {
    logger.error(`Stripe webhook failed for ${event.id}`, error);
    await markWebhookFailed(event.id, error).catch((ledgerError: unknown) => {
      logger.error(
        `Unable to persist Stripe webhook failure ${event.id}`,
        ledgerError,
      );
    });
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
};
