import { describe, expect, it } from "vitest";

import {
  extractOnboardingSkillNames,
  getSuggestedOnboardingStep,
  parseOnboardingSkillInput,
} from "@/features/onboarding/onboarding-state";

describe("new user onboarding state", () => {
  it("resumes at the first incomplete core step", () => {
    expect(
      getSuggestedOnboardingStep({
        hasProfile: false,
        skillCount: 0,
        hasMission: false,
        hasFollowUp: false,
      }),
    ).toBe(1);
    expect(
      getSuggestedOnboardingStep({
        hasProfile: true,
        skillCount: 2,
        hasMission: false,
        hasFollowUp: false,
      }),
    ).toBe(3);
    expect(
      getSuggestedOnboardingStep({
        hasProfile: true,
        skillCount: 2,
        hasMission: true,
        hasFollowUp: true,
      }),
    ).toBe(5);
  });

  it("normalizes, deduplicates and caps entered skills", () => {
    const skills = parseOnboardingSkillInput(
      "React, TypeScript, React, Next.js, Node.js, SQL, UX, Tests, CI, Extra",
    );

    expect(skills).toHaveLength(8);
    expect(skills[0]).toEqual({ name: "React", level: "INTERMEDIATE" });
    expect(skills.filter((skill) => skill.name === "React")).toHaveLength(1);
  });

  it("reads only valid skill names from persisted JSON", () => {
    expect(
      extractOnboardingSkillNames([
        { name: " React " },
        { name: "" },
        { label: "ignored" },
        null,
      ]),
    ).toEqual(["React"]);
  });
});
