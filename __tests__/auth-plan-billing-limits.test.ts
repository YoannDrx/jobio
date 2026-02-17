import { getPlanLimits } from "@/lib/auth/stripe/auth-plans";
import { describe, expect, it } from "vitest";

describe("auth-plan billing limits", () => {
  it("returns billing limits for free plan", () => {
    const limits = getPlanLimits("free");

    expect(limits.billingClients).toBe(10);
    expect(limits.billingQuotes).toBe(20);
    expect(limits.billingInvoices).toBe(20);
    expect(limits.billingCatalogItems).toBe(25);
  });

  it("returns elevated billing limits for pro and ultra plans", () => {
    const proLimits = getPlanLimits("pro");
    const ultraLimits = getPlanLimits("ultra");

    expect(proLimits.billingClients).toBeGreaterThan(
      getPlanLimits("free").billingClients,
    );
    expect(proLimits.billingQuotes).toBe(999999);
    expect(proLimits.billingInvoices).toBe(999999);
    expect(proLimits.billingCatalogItems).toBe(250);

    expect(ultraLimits.billingClients).toBe(999999);
    expect(ultraLimits.billingCatalogItems).toBe(999999);
  });
});
