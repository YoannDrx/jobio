import { PricingFunnelEventType } from "@/generated/prisma";
import { summarizePricingFunnelEvents } from "@/lib/pricing/pricing-funnel-events";
import { describe, expect, it } from "vitest";

describe("pricing funnel events summary", () => {
  it("aggregates totals, plan split and conversion rates", () => {
    const events = [
      {
        eventType: PricingFunnelEventType.PRICING_PAGE_VIEWED,
        planTarget: null,
        entryPoint: "landing",
        experimentVariant: "control",
        createdAt: new Date("2026-02-23T10:00:00.000Z"),
      },
      {
        eventType: PricingFunnelEventType.PLAN_SELECTED,
        planTarget: "pro",
        entryPoint: "landing",
        experimentVariant: "control",
        createdAt: new Date("2026-02-23T10:01:00.000Z"),
      },
      {
        eventType: PricingFunnelEventType.PLAN_SELECTED,
        planTarget: "ultra",
        entryPoint: "use_case_developpeur_freelance",
        experimentVariant: "value_stack",
        createdAt: new Date("2026-02-23T10:02:00.000Z"),
      },
      {
        eventType: PricingFunnelEventType.CHECKOUT_STARTED,
        planTarget: "pro",
        entryPoint: "landing",
        experimentVariant: "control",
        createdAt: new Date("2026-02-23T10:03:00.000Z"),
      },
      {
        eventType: PricingFunnelEventType.SUBSCRIPTION_COMPLETED,
        planTarget: "pro",
        entryPoint: "landing",
        experimentVariant: "control",
        createdAt: new Date("2026-02-23T10:04:00.000Z"),
      },
      {
        eventType: PricingFunnelEventType.PAYWALL_HIT,
        planTarget: "ultra",
        entryPoint: "server_enforce_limit",
        experimentVariant: "value_stack",
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

    expect(summary.byVariant.control.pricingPageViewed).toBe(1);
    expect(summary.byVariant.control.planSelected).toBe(1);
    expect(summary.byVariant.control.checkoutStarted).toBe(1);
    expect(summary.byVariant.control.subscriptionCompleted).toBe(1);
    expect(summary.byVariant.control.conversionRates.checkoutFromSelection).toBe(
      100,
    );

    expect(summary.byVariant.value_stack.planSelected).toBe(1);
    expect(summary.byVariant.value_stack.paywallHit).toBe(1);
    expect(summary.byVariant.value_stack.checkoutStarted).toBe(0);
    expect(
      summary.byVariant.value_stack.conversionRates.checkoutFromSelection,
    ).toBe(0);

    expect(summary.byVariant.roi_focus.planSelected).toBe(0);

    expect(summary.byEntryPoint[0]?.entryPoint).toBe("landing");
    expect(summary.byEntryPoint[0]?.planSelected).toBe(1);
    expect(summary.byEntryPoint[0]?.checkoutStarted).toBe(1);
    expect(summary.byEntryPoint[0]?.subscriptionCompleted).toBe(1);
    expect(summary.byEntryPoint[1]?.entryPoint).toBe(
      "use_case_developpeur_freelance",
    );
    expect(summary.lastEventAt?.toISOString()).toBe("2026-02-23T10:05:00.000Z");
  });
});
