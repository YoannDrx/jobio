import { PricingFunnelEventType } from "@/generated/prisma";
import { summarizePricingFunnelEvents } from "@/lib/pricing/pricing-funnel-events";
import { describe, expect, it } from "vitest";

describe("pricing funnel events summary", () => {
  it("aggregates totals, plan split and conversion rates", () => {
    const events = [
      {
        eventType: PricingFunnelEventType.PRICING_PAGE_VIEWED,
        planTarget: null,
        createdAt: new Date("2026-02-23T10:00:00.000Z"),
      },
      {
        eventType: PricingFunnelEventType.PLAN_SELECTED,
        planTarget: "pro",
        createdAt: new Date("2026-02-23T10:01:00.000Z"),
      },
      {
        eventType: PricingFunnelEventType.PLAN_SELECTED,
        planTarget: "ultra",
        createdAt: new Date("2026-02-23T10:02:00.000Z"),
      },
      {
        eventType: PricingFunnelEventType.CHECKOUT_STARTED,
        planTarget: "pro",
        createdAt: new Date("2026-02-23T10:03:00.000Z"),
      },
      {
        eventType: PricingFunnelEventType.SUBSCRIPTION_COMPLETED,
        planTarget: "pro",
        createdAt: new Date("2026-02-23T10:04:00.000Z"),
      },
      {
        eventType: PricingFunnelEventType.PAYWALL_HIT,
        planTarget: "ultra",
        createdAt: new Date("2026-02-23T10:05:00.000Z"),
      },
    ];

    const summary = summarizePricingFunnelEvents(
      events,
      30,
      new Date("2026-02-23T12:00:00.000Z"),
    );

    expect(summary.totals.pricingPageViewed).toBe(1);
    expect(summary.totals.planSelected).toBe(2);
    expect(summary.totals.checkoutStarted).toBe(1);
    expect(summary.totals.subscriptionCompleted).toBe(1);
    expect(summary.totals.paywallHit).toBe(1);

    expect(summary.byPlan.pro.planSelected).toBe(1);
    expect(summary.byPlan.pro.checkoutStarted).toBe(1);
    expect(summary.byPlan.pro.subscriptionCompleted).toBe(1);

    expect(summary.byPlan.ultra.planSelected).toBe(1);
    expect(summary.byPlan.ultra.paywallHit).toBe(1);
    expect(summary.byPlan.ultra.subscriptionCompleted).toBe(0);

    expect(summary.conversionRates.checkoutFromSelection).toBe(50);
    expect(summary.conversionRates.subscriptionFromCheckout).toBe(100);
    expect(summary.conversionRates.subscriptionFromSelection).toBe(50);
    expect(summary.lastEventAt?.toISOString()).toBe("2026-02-23T10:05:00.000Z");
  });
});
