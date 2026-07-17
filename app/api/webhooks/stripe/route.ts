import { PricingFunnelEventType, Prisma } from "@/generated/prisma";
import { AUTH_PLANS, type AppAuthPlan } from "@/lib/auth/stripe/auth-plans";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { capturePricingFunnelEvent } from "@/lib/pricing/pricing-funnel-events";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

export const maxDuration = 60;

const SUBSCRIPTION_EVENT_TYPES = new Set<Stripe.Event.Type>([
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
]);

type SubscriptionSyncResult = {
  applied: boolean;
  previousStatus: string | null;
  plan: AppAuthPlan;
  referenceId: string;
};

const isUniqueConstraintError = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError &&
  error.code === "P2002";

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

  try {
    return await prisma.$transaction(async (tx) => {
      await tx.stripeWebhookEvent.create({
        data: {
          id: event.id,
          type: event.type,
          livemode: event.livemode,
        },
      });

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
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      const duplicate = await prisma.stripeWebhookEvent.findUnique({
        where: { id: event.id },
        select: { id: true },
      });
      if (duplicate) {
        return {
          applied: false,
          previousStatus: null,
          plan,
          referenceId,
        };
      }
    }
    throw error;
  }
};

const runLifecycleCallbacks = async (
  req: NextRequest,
  subscription: Stripe.Subscription,
  syncResult: SubscriptionSyncResult,
) => {
  if (!syncResult.applied) return;

  const dbSubscription = await prisma.subscription.findUnique({
    where: { referenceId: syncResult.referenceId },
  });
  if (!dbSubscription) return;

  const context = {
    req,
    userId: syncResult.referenceId,
    stripeCustomerId: getCustomerId(subscription),
    subscriptionId: subscription.id,
  };

  try {
    if (
      subscription.status === "trialing" &&
      syncResult.previousStatus !== "trialing"
    ) {
      await syncResult.plan.freeTrial?.onTrialStart?.(dbSubscription, context);
    } else if (
      subscription.status === "active" &&
      syncResult.previousStatus === "trialing"
    ) {
      await syncResult.plan.freeTrial?.onTrialEnd?.(
        { subscription: dbSubscription },
        context,
      );
    } else if (
      subscription.status === "incomplete_expired" &&
      syncResult.previousStatus === "trialing"
    ) {
      await syncResult.plan.freeTrial?.onTrialExpired?.(
        dbSubscription,
        context,
      );
    } else if (subscription.status === "canceled") {
      await syncResult.plan.onSubscriptionCanceled?.(dbSubscription, context);
    }
  } catch (error) {
    logger.error("Stripe lifecycle callback failed", error);
  }
};

const processProgramPurchase = async (
  event: Stripe.Event,
  session: Stripe.Checkout.Session,
) => {
  const programId = session.metadata?.programId;
  const userId = session.metadata?.userId;
  if (!programId || !userId) {
    throw new Error("Missing programId or userId in program purchase metadata");
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.stripeWebhookEvent.create({
        data: { id: event.id, type: event.type, livemode: event.livemode },
      });
      await tx.programPurchase.upsert({
        where: { userId_programId: { userId, programId } },
        update: {
          status: "completed",
          stripeSessionId: session.id,
          stripePaymentIntentId:
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : (session.payment_intent?.id ?? null),
        },
        create: {
          userId,
          programId,
          status: "completed",
          stripeSessionId: session.id,
          stripePaymentIntentId:
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : (session.payment_intent?.id ?? null),
          amount: session.amount_total ?? 0,
          currency: session.currency ?? "eur",
        },
      });
    });
  } catch (error) {
    if (!isUniqueConstraintError(error)) throw error;
  }
};

const processCheckoutCompleted = async (
  event: Stripe.Event,
  session: Stripe.Checkout.Session,
  req: NextRequest,
) => {
  if (
    session.mode === "payment" &&
    session.metadata?.type === "linkedin_program"
  ) {
    await processProgramPurchase(event, session);
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
  await runLifecycleCallbacks(req, subscription, result);

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

  const body = await req.text();
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

  try {
    if (event.type === "checkout.session.completed") {
      await processCheckoutCompleted(event, event.data.object, req);
    } else {
      const subscription = event.data.object as Stripe.Subscription;
      const result = await syncSubscription(event, subscription);
      await runLifecycleCallbacks(req, subscription, result);
    }
  } catch (error) {
    logger.error(`Stripe webhook failed for ${event.id}`, error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
};
