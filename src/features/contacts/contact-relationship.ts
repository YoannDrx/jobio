export type RelationshipTier = "hot" | "warm" | "cold";

export type ContactRelationship = {
  score: number;
  tier: RelationshipTier;
  daysSinceLastInteraction: number | null;
  nextAction: string;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function getRecencyPoints(daysSinceLastInteraction: number | null): number {
  if (daysSinceLastInteraction === null) return 0;
  if (daysSinceLastInteraction <= 3) return 45;
  if (daysSinceLastInteraction <= 7) return 35;
  if (daysSinceLastInteraction <= 14) return 25;
  if (daysSinceLastInteraction <= 30) return 15;
  if (daysSinceLastInteraction <= 60) return 8;
  return 0;
}

function getNextAction(daysSinceLastInteraction: number | null): string {
  if (daysSinceLastInteraction === null) return "Planifier le premier contact";
  if (daysSinceLastInteraction > 21) return "Relancer cette semaine";
  if (daysSinceLastInteraction > 7) return "Relancer aujourd'hui";
  return "Lien actif";
}

function getTier(score: number): RelationshipTier {
  if (score >= 70) return "hot";
  if (score >= 40) return "warm";
  return "cold";
}

export function computeContactRelationship(params: {
  missionCount: number;
  interactionCount: number;
  lastInteractionAt: Date | null;
  now?: Date;
}): ContactRelationship {
  const now = params.now ?? new Date();
  const daysSinceLastInteraction =
    params.lastInteractionAt === null
      ? null
      : Math.floor(
          (now.getTime() - params.lastInteractionAt.getTime()) /
            (1000 * 60 * 60 * 24),
        );

  const recencyPoints = getRecencyPoints(daysSinceLastInteraction);
  const interactionPoints = clamp(params.interactionCount * 3, 0, 30);
  const missionPoints = clamp(params.missionCount * 6, 0, 20);
  const score = clamp(recencyPoints + interactionPoints + missionPoints, 0, 100);

  return {
    score,
    tier: getTier(score),
    daysSinceLastInteraction,
    nextAction: getNextAction(daysSinceLastInteraction),
  };
}
