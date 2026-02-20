import { getPlanLimits } from "@/lib/auth/stripe/auth-plans";
import { describe, expect, it } from "vitest";

describe("auth-plan billing limits", () => {
  it("returns billing limits for free plan", () => {
    const limits = getPlanLimits("free");

    expect(limits.billingClients).toBe(0);
    expect(limits.billingQuotes).toBe(0);
    expect(limits.billingInvoices).toBe(0);
    expect(limits.billingCatalogItems).toBe(0);
  });

  it("returns elevated billing limits for pro and ultra plans", () => {
    const proLimits = getPlanLimits("pro");
    const ultraLimits = getPlanLimits("ultra");

    expect(proLimits.billingClients).toBe(10);
    expect(proLimits.billingQuotes).toBe(50);
    expect(proLimits.billingInvoices).toBe(50);
    expect(proLimits.billingCatalogItems).toBe(25);

    expect(ultraLimits.billingClients).toBe(999999);
    expect(ultraLimits.billingQuotes).toBe(999999);
    expect(ultraLimits.billingInvoices).toBe(999999);
    expect(ultraLimits.billingCatalogItems).toBe(999999);
  });

  it("returns new plan features for all plans", () => {
    const free = getPlanLimits("free");
    const pro = getPlanLimits("pro");
    const ultra = getPlanLimits("ultra");

    // CV Lab
    expect(free.cvDocuments).toBe(1);
    expect(pro.cvDocuments).toBe(10);
    expect(ultra.cvDocuments).toBe(999999);

    // Boolean features
    expect(free.csvExport).toBe(0);
    expect(pro.csvExport).toBe(1);
    expect(ultra.csvExport).toBe(1);

    expect(free.cvCoachAI).toBe(0);
    expect(pro.cvCoachAI).toBe(0);
    expect(ultra.cvCoachAI).toBe(1);

    // Sequences
    expect(free.sequences).toBe(0);
    expect(pro.sequences).toBe(3);
    expect(ultra.sequences).toBe(999999);
  });
});
