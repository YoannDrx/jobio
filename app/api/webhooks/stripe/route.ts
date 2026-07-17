import { AUTH_PLANS } from "@/lib/auth/stripe/auth-plans";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { capturePricingFunnelEvent } from "@/lib/pricing/pricing-funnel-events";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { headers } from "next/headers";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { PricingFunnelEventType } from "@/generated/prisma";
export const maxDuration = 300;

// Utility function to get plan from subscription metadata
const getPlanFromSubscription = (subscription: Stripe.Subscription) => {
  const planName = subscription.metadata.plan;
  if (!planName) return null;

  return AUTH_PLANS.find((p) => p.name === planName);
};

export const POST = async (req: NextRequest) => {
  const headerList = await headers();
  const body = await req.text();

  const stripeSignature = headerList.get("stripe-signature");

  if (!env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "Stripe webhook is not configured" },
      { status: 503 },
    );
  }

  if (!stripeSignature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 },
    );
  }

  let event: Stripe.Event | null = null;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      stripeSignature,
      env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err: unknown) {
    logger.error("Stripe webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Invalid Stripe webhook signature" },
      { status: 400 },
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await checkoutSessionCompleted(event.data.object, req);
        break;
      case "customer.subscription.updated":
        await customerSubscriptionUpdated(event.data.object, req);
        break;
      case "customer.subscription.deleted":
        await customerSubscriptionDeleted(event.data.object, req);
        break;
      default:
        logger.info(`Ignored Stripe event type: ${event.type}`);
        break;
    }
  } catch (error) {
    logger.error(`Error handling webhook event ${event.type}:`, error);
    return NextResponse.json(
      { error: "Webhook handler failed", eventType: event.type },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
  });
};

const handleProgramPurchaseCompleted = async (
  session: Stripe.Checkout.Session,
) => {
  const programId = session.metadata?.programId;
  const userId = session.metadata?.userId;

  if (!programId || !userId) {
    logger.error("Missing programId or userId in program purchase metadata");
    return;
  }

  await prisma.programPurchase.upsert({
    where: {
      userId_programId: { userId, programId },
    },
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

  logger.info(
    `Program purchase completed for user: ${userId}, program: ${programId}`,
  );
};

const checkoutSessionCompleted = async (
  sessionData: Stripe.Checkout.Session,
  req: NextRequest,
) => {
  const session = sessionData;

  // Handle LinkedIn program one-time purchases
  if (
    session.mode === "payment" &&
    session.metadata?.type === "linkedin_program"
  ) {
    await handleProgramPurchaseCompleted(session);
    return;
  }

  if (!session.customer || !session.subscription) {
    logger.warn("Missing customer or subscription in checkout session");
    return;
  }

  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer.id;
  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription.id;

  // Find user by Stripe customer ID
  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (!user) {
    logger.error(`User not found for customer ID: ${customerId}`);
    return;
  }

  // Get the subscription from Stripe to get the price details
  const stripeSubscription =
    await stripe.subscriptions.retrieve(subscriptionId);
  const priceId = stripeSubscription.items.data[0]?.price.id;

  if (!priceId) {
    logger.error(`No price ID found for subscription: ${subscriptionId}`);
    return;
  }

  // Get plan from subscription metadata
  const plan = getPlanFromSubscription(stripeSubscription);
  if (!plan) {
    logger.error(`Plan not found in subscription metadata: ${subscriptionId}`);
    return;
  }

  // Create or update subscription
  const existingSubscription = await prisma.subscription.findFirst({
    where: { referenceId: user.id },
  });

  let dbSubscription;
  if (existingSubscription) {
    dbSubscription = await prisma.subscription.update({
      where: { id: existingSubscription.id },
      data: {
        plan: plan.name,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        status: stripeSubscription.status,
        periodStart: new Date(
          stripeSubscription.items.data[0].current_period_start * 1000,
        ),
        periodEnd: new Date(
          stripeSubscription.items.data[0].current_period_end * 1000,
        ),
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      },
    });
  } else {
    dbSubscription = await prisma.subscription.create({
      data: {
        id: `sub_${Date.now()}`,
        plan: plan.name,
        referenceId: user.id,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        status: stripeSubscription.status,
        periodStart: new Date(
          stripeSubscription.items.data[0].current_period_start * 1000,
        ),
        periodEnd: new Date(
          stripeSubscription.items.data[0].current_period_end * 1000,
        ),
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      },
    });
  }

  // Call onTrialStart if this is a trial subscription
  if (
    stripeSubscription.status === "trialing" &&
    plan.freeTrial?.onTrialStart
  ) {
    await plan.freeTrial.onTrialStart(dbSubscription, {
      req,
      userId: user.id,
      stripeCustomerId: customerId,
      subscriptionId: subscriptionId,
    });
  }

  await capturePricingFunnelEvent({
    eventType: PricingFunnelEventType.SUBSCRIPTION_COMPLETED,
    userId: user.id,
    planCurrent: existingSubscription?.plan ?? "free",
    planTarget: plan.name,
    billingCycle:
      stripeSubscription.items.data[0]?.price.recurring?.interval === "year"
        ? "yearly"
        : "monthly",
    entryPoint: session.metadata?.entryPoint ?? "stripe_checkout",
    experimentVariant:
      session.metadata?.experimentVariant ??
      stripeSubscription.metadata.experimentVariant,
    checkoutSessionId: session.id,
    stripeSubscriptionId: subscriptionId,
    metadata: {
      status: stripeSubscription.status,
    },
  });

  logger.info(
    `Subscription created/updated for user: ${user.id}, plan: ${plan.name}`,
  );
};

const customerSubscriptionUpdated = async (
  subscriptionData: Stripe.Subscription,
  req: NextRequest,
) => {
  const subscription = subscriptionData;

  logger.info("Processing customer.subscription.updated:", subscription.id);

  // Find the subscription in our database
  const dbSubscription = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId: subscription.id },
  });

  if (!dbSubscription) {
    logger.error(`Subscription not found in database: ${subscription.id}`);
    return;
  }

  // Get plan from subscription metadata
  const plan = getPlanFromSubscription(subscription);
  const planName = plan?.name ?? dbSubscription.plan; // Keep current plan as fallback

  // Update subscription details
  const updatedSubscription = await prisma.subscription.update({
    where: { id: dbSubscription.id },
    data: {
      plan: planName,
      status: subscription.status,
      periodStart: new Date(
        subscription.items.data[0].current_period_start * 1000,
      ),
      periodEnd: new Date(subscription.items.data[0].current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  });

  // Handle trial transitions
  if (plan?.freeTrial) {
    // Trial ended and became active
    if (
      subscription.status === "active" &&
      dbSubscription.status === "trialing" &&
      plan.freeTrial.onTrialEnd
    ) {
      await plan.freeTrial.onTrialEnd(
        { subscription: updatedSubscription },
        {
          req,
          userId: updatedSubscription.referenceId,
          stripeCustomerId: subscription.customer as string,
          subscriptionId: subscription.id,
        },
      );
    }

    // Trial expired
    if (
      subscription.status === "incomplete_expired" &&
      dbSubscription.status === "trialing" &&
      plan.freeTrial.onTrialExpired
    ) {
      await plan.freeTrial.onTrialExpired(updatedSubscription, {
        req,
        userId: updatedSubscription.referenceId,
        stripeCustomerId: subscription.customer as string,
        subscriptionId: subscription.id,
      });
    }
  }

  logger.info(
    `Subscription updated: ${subscription.id}, status: ${subscription.status}, plan: ${planName}`,
  );
};

const customerSubscriptionDeleted = async (
  subscriptionData: Stripe.Subscription,
  req: NextRequest,
) => {
  const subscription = subscriptionData;

  logger.info("Processing customer.subscription.deleted:", subscription.id);

  // Find and update the subscription status
  const dbSubscription = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId: subscription.id },
  });

  if (!dbSubscription) {
    logger.error(`Subscription not found in database: ${subscription.id}`);
    return;
  }

  // Get plan from subscription metadata
  const plan = getPlanFromSubscription(subscription);

  // Update subscription to canceled/free plan
  const updatedSubscription = await prisma.subscription.update({
    where: { id: dbSubscription.id },
    data: {
      plan: "free",
      status: "canceled",
      cancelAtPeriodEnd: false,
      periodEnd: new Date(), // Set to current time since it's canceled
    },
  });

  // Call onSubscriptionCanceled if available
  if (plan?.onSubscriptionCanceled) {
    await plan.onSubscriptionCanceled(updatedSubscription, {
      req,
      userId: updatedSubscription.referenceId,
      stripeCustomerId: subscription.customer as string,
      subscriptionId: subscription.id,
    });
  }

  logger.info(
    `Subscription canceled and reverted to free plan: ${subscription.id}`,
  );
};
