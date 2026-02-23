import {
  Prisma,
  PricingFunnelEventType,
  type PricingFunnelEvent,
} from "@/generated/prisma";
import { logger } from "@/lib/logger";
import {
  DEFAULT_PRICING_EXPERIMENT_VARIANT,
  PRICING_EXPERIMENT_VARIANTS,
  normalizePricingExperimentVariant,
  type PricingExperimentVariant,
} from "@/lib/pricing/pricing-experiments";
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
  experimentVariant?: string | null;
  checkoutSessionId?: string | null;
  stripeSubscriptionId?: string | null;
  metadata?: Record<string, unknown> | null;
};

type PricingFunnelVariantStats = {
  pricingPageViewed: number;
  planSelected: number;
  checkoutStarted: number;
  subscriptionCompleted: number;
  paywallHit: number;
  conversionRates: {
    checkoutFromSelection: number;
    subscriptionFromCheckout: number;
    subscriptionFromSelection: number;
  };
};

type PricingFunnelEntryPointStats = {
  entryPoint: string;
  pricingPageViewed: number;
  planSelected: number;
  checkoutStarted: number;
  subscriptionCompleted: number;
  paywallHit: number;
  conversionRates: {
    checkoutFromSelection: number;
    subscriptionFromCheckout: number;
    subscriptionFromSelection: number;
  };
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
  byVariant: Record<PricingExperimentVariant, PricingFunnelVariantStats>;
  byEntryPoint: PricingFunnelEntryPointStats[];
  lastEventAt: Date | null;
};

type SummaryInputEvent = Pick<
  PricingFunnelEvent,
  "eventType" | "planTarget" | "entryPoint" | "experimentVariant" | "createdAt"
>;

const isMissingPricingFunnelSchema = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError &&
  (error.code === "P2021" || error.code === "P2022");

const isDuplicateCheckoutSessionEvent = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";

const toPercent = (value: number): number =>
  Number.isFinite(value) ? Math.round(value * 100) / 100 : 0;

const computeRate = (numerator: number, denominator: number): number => {
  if (denominator <= 0) return 0;
  return toPercent((numerator / denominator) * 100);
};

const createEmptyVariantStats = (): PricingFunnelVariantStats => ({
  pricingPageViewed: 0,
  planSelected: 0,
  checkoutStarted: 0,
  subscriptionCompleted: 0,
  paywallHit: 0,
  conversionRates: {
    checkoutFromSelection: 0,
    subscriptionFromCheckout: 0,
    subscriptionFromSelection: 0,
  },
});

const createEmptyEntryPointStats = (
  entryPoint: string,
): PricingFunnelEntryPointStats => ({
  entryPoint,
  pricingPageViewed: 0,
  planSelected: 0,
  checkoutStarted: 0,
  subscriptionCompleted: 0,
  paywallHit: 0,
  conversionRates: {
    checkoutFromSelection: 0,
    subscriptionFromCheckout: 0,
    subscriptionFromSelection: 0,
  },
});

const createEmptyByVariant = (): Record<
  PricingExperimentVariant,
  PricingFunnelVariantStats
> =>
  PRICING_EXPERIMENT_VARIANTS.reduce(
    (acc, variant) => {
      acc[variant] = createEmptyVariantStats();
      return acc;
    },
    {} as Record<PricingExperimentVariant, PricingFunnelVariantStats>,
  );

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
    byVariant: createEmptyByVariant(),
    byEntryPoint: [],
    lastEventAt: null,
  };
};

export const summarizePricingFunnelEvents = (
  events: SummaryInputEvent[],
  periodDays: number,
  now = new Date(),
): PricingFunnelSummary => {
  const summary = createEmptySummary(periodDays, now);
  const entryPointBuckets = new Map<string, PricingFunnelEntryPointStats>();

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

    const entryPoint =
      event.entryPoint?.trim().toLowerCase() && event.entryPoint.length > 0
        ? event.entryPoint.trim().toLowerCase()
        : "unknown";
    const entryPointBucket =
      entryPointBuckets.get(entryPoint) ??
      createEmptyEntryPointStats(entryPoint);
    if (!entryPointBuckets.has(entryPoint)) {
      entryPointBuckets.set(entryPoint, entryPointBucket);
    }
    switch (event.eventType) {
      case PricingFunnelEventType.PRICING_PAGE_VIEWED:
        entryPointBucket.pricingPageViewed += 1;
        break;
      case PricingFunnelEventType.PLAN_SELECTED:
        entryPointBucket.planSelected += 1;
        break;
      case PricingFunnelEventType.CHECKOUT_STARTED:
        entryPointBucket.checkoutStarted += 1;
        break;
      case PricingFunnelEventType.SUBSCRIPTION_COMPLETED:
        entryPointBucket.subscriptionCompleted += 1;
        break;
      case PricingFunnelEventType.PAYWALL_HIT:
        entryPointBucket.paywallHit += 1;
        break;
      default:
        break;
    }

    const variant =
      normalizePricingExperimentVariant(event.experimentVariant) ??
      DEFAULT_PRICING_EXPERIMENT_VARIANT;
    const variantBucket = summary.byVariant[variant];
    switch (event.eventType) {
      case PricingFunnelEventType.PRICING_PAGE_VIEWED:
        variantBucket.pricingPageViewed += 1;
        break;
      case PricingFunnelEventType.PLAN_SELECTED:
        variantBucket.planSelected += 1;
        break;
      case PricingFunnelEventType.CHECKOUT_STARTED:
        variantBucket.checkoutStarted += 1;
        break;
      case PricingFunnelEventType.SUBSCRIPTION_COMPLETED:
        variantBucket.subscriptionCompleted += 1;
        break;
      case PricingFunnelEventType.PAYWALL_HIT:
        variantBucket.paywallHit += 1;
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

  for (const variant of PRICING_EXPERIMENT_VARIANTS) {
    const variantSummary = summary.byVariant[variant];
    variantSummary.conversionRates.checkoutFromSelection = computeRate(
      variantSummary.checkoutStarted,
      variantSummary.planSelected,
    );
    variantSummary.conversionRates.subscriptionFromCheckout = computeRate(
      variantSummary.subscriptionCompleted,
      variantSummary.checkoutStarted,
    );
    variantSummary.conversionRates.subscriptionFromSelection = computeRate(
      variantSummary.subscriptionCompleted,
      variantSummary.planSelected,
    );
  }

  summary.byEntryPoint = [...entryPointBuckets.values()]
    .map((bucket) => ({
      ...bucket,
      conversionRates: {
        checkoutFromSelection: computeRate(
          bucket.checkoutStarted,
          bucket.planSelected,
        ),
        subscriptionFromCheckout: computeRate(
          bucket.subscriptionCompleted,
          bucket.checkoutStarted,
        ),
        subscriptionFromSelection: computeRate(
          bucket.subscriptionCompleted,
          bucket.planSelected,
        ),
      },
    }))
    .sort((a, b) => {
      if (b.subscriptionCompleted !== a.subscriptionCompleted) {
        return b.subscriptionCompleted - a.subscriptionCompleted;
      }
      if (b.checkoutStarted !== a.checkoutStarted) {
        return b.checkoutStarted - a.checkoutStarted;
      }
      return b.planSelected - a.planSelected;
    })
    .slice(0, 10);

  return summary;
};

export async function capturePricingFunnelEvent(
  input: PricingFunnelCaptureInput,
): Promise<void> {
  const experimentVariant = normalizePricingExperimentVariant(
    input.experimentVariant,
  );

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
        experimentVariant,
        checkoutSessionId: input.checkoutSessionId ?? null,
        stripeSubscriptionId: input.stripeSubscriptionId ?? null,
        metadata: input.metadata
          ? (JSON.parse(JSON.stringify(input.metadata)) as Prisma.InputJsonValue)
          : undefined,
      },
    });
  } catch (error) {
    if (isMissingPricingFunnelSchema(error)) {
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
        entryPoint: true,
        experimentVariant: true,
        createdAt: true,
      },
    });

    return summarizePricingFunnelEvents(events, periodDays, now);
  } catch (error) {
    if (isMissingPricingFunnelSchema(error)) {
      return {
        ...summary,
        available: false,
      };
    }

    throw error;
  }
}
