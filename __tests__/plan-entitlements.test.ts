import { getPlanLimits } from "@/lib/auth/stripe/auth-plans";
import {
  parsePlanEntitlementOverrides,
  resolvePlanLimitsForPlan,
} from "@/lib/auth/stripe/plan-entitlements";
import { afterEach, describe, expect, it } from "vitest";

const originalDbFlag = process.env.PLAN_ENTITLEMENTS_DB_ENABLED;

afterEach(() => {
  process.env.PLAN_ENTITLEMENTS_DB_ENABLED = originalDbFlag;
});

describe("plan entitlements", () => {
  it("parses overrides and ignores unknown keys", () => {
    const { overrides, ignoredFeatureKeys } = parsePlanEntitlementOverrides([
      { featureKey: "contacts", value: 150 },
      { featureKey: "csvExport", value: 1 },
      { featureKey: "unknownFeature", value: 10 },
      { featureKey: "profiles", value: Number.POSITIVE_INFINITY },
      { featureKey: "missions", value: -5.4 },
    ]);

    expect(overrides.contacts).toBe(150);
    expect(overrides.csvExport).toBe(1);
    expect(overrides.missions).toBe(0);
    expect(overrides.profiles).toBeUndefined();
    expect(ignoredFeatureKeys).toEqual(["unknownFeature", "profiles"]);
  });

  it("falls back to static limits when db entitlements are disabled", async () => {
    process.env.PLAN_ENTITLEMENTS_DB_ENABLED = "false";

    const result = await resolvePlanLimitsForPlan("pro", {
      contacts: 123,
    });

    const proLimits = getPlanLimits("pro");

    expect(result.source).toBe("static");
    expect(result.version).toBeNull();
    expect(result.plan).toBe("pro");
    expect(result.limits.contacts).toBe(123);
    expect(result.limits.missions).toBe(proLimits.missions);
    expect(result.limits.csvExport).toBe(proLimits.csvExport);
  });
});
