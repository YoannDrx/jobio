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
    expect(getMinimumPlanForFeature("csvExport")).toBe("pro");
    expect(getMinimumPlanForFeature("atsScoring")).toBe("pro");
    expect(getMinimumPlanForFeature("cvCoachAI")).toBe("ultra");
  });

  it("exposes stable access labels for marketing copy", () => {
    expect(getPlanAccessLabelForFeature("missions")).toBeNull();
    expect(getPlanAccessLabelForFeature("sequences")).toBe("Pro+");
    expect(getPlanAccessLabelForFeature("cvCoachAI")).toBe("Ultra");
    expect(withPlanBadge("Coach CV IA", "cvCoachAI")).toBe(
      "Coach CV IA (Ultra)",
    );
    expect(withPlanBadge("Pipeline", "missions")).toBe("Pipeline");
  });

  it("formats count and support labels", () => {
    expect(formatPlanCount(999_999)).toBe("Illimité");
    expect(formatPlanCount(50)).toBe("50");
    expect(getPlanSupportLabel("free")).toBe("Communautaire");
    expect(getPlanSupportLabel("pro")).toBe("Email prioritaire");
    expect(getPlanSupportLabel("ultra")).toBe("Chat prioritaire");
  });
});
