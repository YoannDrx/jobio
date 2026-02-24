export const PricingFunnelEventNames = {
  PRICING_PAGE_VIEWED: "PRICING_PAGE_VIEWED",
  PLAN_SELECTED: "PLAN_SELECTED",
  CHECKOUT_STARTED: "CHECKOUT_STARTED",
  SUBSCRIPTION_COMPLETED: "SUBSCRIPTION_COMPLETED",
  PAYWALL_HIT: "PAYWALL_HIT",
} as const;

export type PricingFunnelEventName =
  (typeof PricingFunnelEventNames)[keyof typeof PricingFunnelEventNames];
