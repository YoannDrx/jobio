import {
  Prisma,
  PricingFunnelEventType,
  type PricingFunnelEvent,
} from "@/generated/prisma";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

type TrackedPlan = "pro" | "ultra";

export type PricingFunnelCaptureInput = {
  eventType: PricingFunnelEventType;
  userId?: string | null;
  planCurrent?: string | null;
  planTarget?: string | null;
  billingCycle?: string | null;
  entryPoint?: string | null;
  featureKey?: string | null;
  checkoutSessionId?: string | null;
  stripeSubscriptionId?: string | null;
  metadata?: Record<string, unknown> | null;
};

export type PricingFunnelSummary = {
  available: boolean;
  periodDays: number;
  fromDate: Date;
  totals: {
    pricingPageViewed: number;
    planSelected: number;
    checkoutStarted: number;
    subscriptionCompleted: number;
    paywallHit: number;
  };
  byPlan: Record<
    TrackedPlan,
    {
      planSelected: number;
      checkoutStarted: number;
      subscriptionCompleted: number;
      paywallHit: number;
    }
  >;
  conversionRates: {
    checkoutFromSelection: number;
    subscriptionFromCheckout: number;
    subscriptionFromSelection: number;
  };
  lastEventAt: Date | null;
};

type SummaryInputEvent = Pick<
  PricingFunnelEvent,
  "eventType" | "planTarget" | "createdAt"
>;

const isMissingPricingFunnelTable = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021";

const isDuplicateCheckoutSessionEvent = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";

const toPercent = (value: number): number =>
  Number.isFinite(value) ? Math.round(value * 100) / 100 : 0;

const computeRate = (numerator: number, denominator: number): number => {
  if (denominator <= 0) return 0;
  return toPercent((numerator / denominator) * 100);
};

const createEmptySummary = (periodDays: number, now: Date): PricingFunnelSummary => {
  const fromDate = new Date(now);
  fromDate.setDate(fromDate.getDate() - periodDays);

  return {
    available: true,
    periodDays,
    fromDate,
    totals: {
      pricingPageViewed: 0,
      planSelected: 0,
      checkoutStarted: 0,
      subscriptionCompleted: 0,
      paywallHit: 0,
    },
    byPlan: {
      pro: {
        planSelected: 0,
        checkoutStarted: 0,
        subscriptionCompleted: 0,
        paywallHit: 0,
      },
      ultra: {
        planSelected: 0,
        checkoutStarted: 0,
        subscriptionCompleted: 0,
        paywallHit: 0,
      },
    },
    conversionRates: {
      checkoutFromSelection: 0,
      subscriptionFromCheckout: 0,
      subscriptionFromSelection: 0,
    },
    lastEventAt: null,
  };
};

export const summarizePricingFunnelEvents = (
  events: SummaryInputEvent[],
  periodDays: number,
  now = new Date(),
): PricingFunnelSummary => {
  const summary = createEmptySummary(periodDays, now);

  for (const event of events) {
    if (!summary.lastEventAt || event.createdAt > summary.lastEventAt) {
      summary.lastEventAt = event.createdAt;
    }

    switch (event.eventType) {
      case PricingFunnelEventType.PRICING_PAGE_VIEWED:
        summary.totals.pricingPageViewed += 1;
        break;
      case PricingFunnelEventType.PLAN_SELECTED:
        summary.totals.planSelected += 1;
        break;
      case PricingFunnelEventType.CHECKOUT_STARTED:
        summary.totals.checkoutStarted += 1;
        break;
      case PricingFunnelEventType.SUBSCRIPTION_COMPLETED:
        summary.totals.subscriptionCompleted += 1;
        break;
      case PricingFunnelEventType.PAYWALL_HIT:
        summary.totals.paywallHit += 1;
        break;
      default:
        break;
    }

    const plan = event.planTarget?.toLowerCase();
    if (plan !== "pro" && plan !== "ultra") {
      continue;
    }

    switch (event.eventType) {
      case PricingFunnelEventType.PLAN_SELECTED:
        summary.byPlan[plan].planSelected += 1;
        break;
      case PricingFunnelEventType.CHECKOUT_STARTED:
        summary.byPlan[plan].checkoutStarted += 1;
        break;
      case PricingFunnelEventType.SUBSCRIPTION_COMPLETED:
        summary.byPlan[plan].subscriptionCompleted += 1;
        break;
      case PricingFunnelEventType.PAYWALL_HIT:
        summary.byPlan[plan].paywallHit += 1;
        break;
      default:
        break;
    }
  }

  summary.conversionRates.checkoutFromSelection = computeRate(
    summary.totals.checkoutStarted,
    summary.totals.planSelected,
  );
  summary.conversionRates.subscriptionFromCheckout = computeRate(
    summary.totals.subscriptionCompleted,
    summary.totals.checkoutStarted,
  );
  summary.conversionRates.subscriptionFromSelection = computeRate(
    summary.totals.subscriptionCompleted,
    summary.totals.planSelected,
  );

  return summary;
};

export async function capturePricingFunnelEvent(
  input: PricingFunnelCaptureInput,
): Promise<void> {
  try {
    await prisma.pricingFunnelEvent.create({
      data: {
        eventType: input.eventType,
        userId: input.userId ?? null,
        planCurrent: input.planCurrent ?? null,
        planTarget: input.planTarget ?? null,
        billingCycle: input.billingCycle ?? null,
        entryPoint: input.entryPoint ?? null,
        featureKey: input.featureKey ?? null,
        checkoutSessionId: input.checkoutSessionId ?? null,
        stripeSubscriptionId: input.stripeSubscriptionId ?? null,
        metadata: input.metadata
          ? (JSON.parse(JSON.stringify(input.metadata)) as Prisma.InputJsonValue)
          : undefined,
      },
    });
  } catch (error) {
    if (isMissingPricingFunnelTable(error)) {
      return;
    }

    if (input.checkoutSessionId && isDuplicateCheckoutSessionEvent(error)) {
      return;
    }

    logger.warn("Failed to capture pricing funnel event", error);
  }
}

export async function getPricingFunnelSummary(
  periodDays = 30,
): Promise<PricingFunnelSummary> {
  const now = new Date();
  const summary = createEmptySummary(periodDays, now);

  try {
    const events = await prisma.pricingFunnelEvent.findMany({
      where: {
        createdAt: {
          gte: summary.fromDate,
        },
      },
      select: {
        eventType: true,
        planTarget: true,
        createdAt: true,
      },
    });

    return summarizePricingFunnelEvents(events, periodDays, now);
  } catch (error) {
    if (isMissingPricingFunnelTable(error)) {
      return {
        ...summary,
        available: false,
      };
    }

    throw error;
  }
}
