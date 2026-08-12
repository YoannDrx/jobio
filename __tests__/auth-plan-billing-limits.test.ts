import { getPlanLimits } from "@/lib/auth/stripe/auth-plans";
import { describe, expect, it } from "vitest";

describe("auth-plan billing limits", () => {
  it("returns billing limits for free plan", () => {
    const limits = getPlanLimits("free");

    expect(limits.billingClients).toBe(3);
    expect(limits.billingQuotes).toBe(5);
    expect(limits.billingInvoices).toBe(5);
    expect(limits.billingCatalogItems).toBe(5);
  });

  it("returns the commercial billing limits for Pro", () => {
    const proLimits = getPlanLimits("pro");

    expect(proLimits.billingClients).toBe(999999);
    expect(proLimits.billingQuotes).toBe(999999);
    expect(proLimits.billingInvoices).toBe(999999);
    expect(proLimits.billingCatalogItems).toBe(999999);
    expect(proLimits.billingRecurringInvoices).toBe(50);
  });

  it("returns new plan features for all plans", () => {
    const free = getPlanLimits("free");
    const pro = getPlanLimits("pro");

    // CV Lab
    expect(free.cvDocuments).toBe(1);
    expect(pro.cvDocuments).toBe(20);

    // Boolean features
    expect(free.csvExport).toBe(1);
    expect(pro.csvExport).toBe(1);

    expect(free.cvCoachAI).toBe(0);
    expect(pro.cvCoachAI).toBe(1);

    // Sequences
    expect(free.sequences).toBe(0);
    expect(pro.sequences).toBe(20);
  });
});
