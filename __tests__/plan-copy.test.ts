import {
  formatPlanCount,
  getMinimumPlanForFeature,
  getPlanAccessLabelForFeature,
  getPlanSupportLabel,
  withPlanBadge,
} from "@/features/plans/plan-copy";
import { describe, expect, it } from "vitest";

describe("plan copy helpers", () => {
  it("resolves minimum access plan by feature", () => {
    expect(getMinimumPlanForFeature("missions")).toBe("free");
    expect(getMinimumPlanForFeature("csvExport")).toBe("free");
    expect(getMinimumPlanForFeature("atsScoring")).toBe("pro");
    expect(getMinimumPlanForFeature("cvCoachAI")).toBe("pro");
  });

  it("exposes stable access labels for marketing copy", () => {
    expect(getPlanAccessLabelForFeature("missions")).toBeNull();
    expect(getPlanAccessLabelForFeature("sequences")).toBe("Pro");
    expect(getPlanAccessLabelForFeature("cvCoachAI")).toBe("Pro");
    expect(withPlanBadge("Coach CV IA", "cvCoachAI")).toBe("Coach CV IA (Pro)");
    expect(withPlanBadge("Pipeline", "missions")).toBe("Pipeline");
  });

  it("formats count and support labels", () => {
    expect(formatPlanCount(999_999)).toBe("Illimité");
    expect(formatPlanCount(50)).toBe("50");
    expect(getPlanSupportLabel("free")).toBe("Communautaire");
    expect(getPlanSupportLabel("pro")).toBe("Email prioritaire");
  });
});
