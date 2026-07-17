export const extractOnboardingSkillNames = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];

  return value.flatMap((skill) => {
    if (!skill || typeof skill !== "object" || !("name" in skill)) return [];
    const name = (skill as { name?: unknown }).name;
    return typeof name === "string" && name.trim().length > 0
      ? [name.trim()]
      : [];
  });
};

export const parseOnboardingSkillInput = (value: string) =>
  [...new Set(value.split(",").map((skill) => skill.trim()).filter(Boolean))]
    .slice(0, 8)
    .map((name) => ({ name, level: "INTERMEDIATE" as const }));

export const getSuggestedOnboardingStep = (state: {
  hasProfile: boolean;
  skillCount: number;
  hasMission: boolean;
  hasFollowUp: boolean;
}) => {
  if (!state.hasProfile) return 1;
  if (state.skillCount === 0) return 2;
  if (!state.hasMission) return 3;
  if (!state.hasFollowUp) return 4;
  return 5;
};
