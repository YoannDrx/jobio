import { prisma } from "@/lib/prisma";

type MissionData = {
  stack: string[];
  tjm: number | null;
  workType: string | null;
  location: string | null;
  description: string | null;
  company: string | null;
  duration: string | null;
};

type ProfileData = {
  skills: { name: string; level: string; yearsExp?: number }[];
  tjmTarget: number | null;
  workTypePreference: string | null;
  zone: string | null;
};

export type ScoreBreakdown = {
  score: number;
  breakdown: {
    skills: { score: number; max: number; matched: string[] };
    tjm: { score: number; max: number };
    workType: { score: number; max: number };
    location: { score: number; max: number };
    completeness: { score: number; max: number };
  };
};

export function scoreMission(
  mission: MissionData,
  profile: ProfileData,
): ScoreBreakdown {
  const breakdown: ScoreBreakdown["breakdown"] = {
    skills: { score: 0, max: 40, matched: [] },
    tjm: { score: 0, max: 20 },
    workType: { score: 0, max: 15 },
    location: { score: 0, max: 15 },
    completeness: { score: 0, max: 10 },
  };

  // Skills match: +40 max
  if (mission.stack.length > 0 && profile.skills.length > 0) {
    const profileSkillNames = profile.skills.map((s) => s.name.toLowerCase());
    const matched = mission.stack.filter((tech) =>
      profileSkillNames.includes(tech.toLowerCase()),
    );
    const matchRatio = matched.length / mission.stack.length;
    breakdown.skills.score = Math.round(matchRatio * 40);
    breakdown.skills.matched = matched;
  }

  // TJM match: +20 if within ±20%
  if (mission.tjm && profile.tjmTarget) {
    const ratio = mission.tjm / profile.tjmTarget;
    if (ratio >= 0.8 && ratio <= 1.2) {
      breakdown.tjm.score = 20;
    } else if (ratio >= 0.6 && ratio <= 1.4) {
      breakdown.tjm.score = 10;
    }
  }

  // WorkType match: +15
  if (mission.workType && profile.workTypePreference) {
    if (mission.workType === profile.workTypePreference) {
      breakdown.workType.score = 15;
    } else if (
      mission.workType === "HYBRID" ||
      profile.workTypePreference === "HYBRID"
    ) {
      breakdown.workType.score = 7;
    }
  }

  // Zone/Location match: +15
  if (mission.location && profile.zone) {
    const missionLoc = mission.location.toLowerCase();
    const profileZone = profile.zone.toLowerCase();
    if (missionLoc.includes(profileZone) || profileZone.includes(missionLoc)) {
      breakdown.location.score = 15;
    }
  }

  // Info completeness: +10
  let completenessCount = 0;
  if (mission.description) completenessCount++;
  if (mission.company) completenessCount++;
  if (mission.duration) completenessCount++;
  if (mission.tjm) completenessCount++;
  if (mission.workType) completenessCount++;
  breakdown.completeness.score = Math.round((completenessCount / 5) * 10);

  const totalScore =
    breakdown.skills.score +
    breakdown.tjm.score +
    breakdown.workType.score +
    breakdown.location.score +
    breakdown.completeness.score;

  return {
    score: Math.min(100, totalScore),
    breakdown,
  };
}

export async function computeMissionScore(
  missionId: string,
  userId: string,
): Promise<ScoreBreakdown> {
  const mission = await prisma.mission.findFirst({
    where: { id: missionId, userId, deletedAt: null },
    select: {
      stack: true,
      tjm: true,
      workType: true,
      location: true,
      description: true,
      company: true,
      duration: true,
      profileId: true,
    },
  });

  if (!mission) {
    return {
      score: 0,
      breakdown: {
        skills: { score: 0, max: 40, matched: [] },
        tjm: { score: 0, max: 20 },
        workType: { score: 0, max: 15 },
        location: { score: 0, max: 15 },
        completeness: { score: 0, max: 10 },
      },
    };
  }

  // Use linked profile if available, otherwise fall back to default profile
  const profile = mission.profileId
    ? await prisma.userProfile.findFirst({
        where: { id: mission.profileId, userId },
        select: {
          skills: true,
          tjmTarget: true,
          workTypePreference: true,
          zone: true,
        },
      })
    : await prisma.userProfile.findFirst({
        where: { userId, isDefault: true },
        select: {
          skills: true,
          tjmTarget: true,
          workTypePreference: true,
          zone: true,
        },
      });

  if (!profile) {
    // Without a profile, score based on completeness only
    let completenessCount = 0;
    if (mission.description) completenessCount++;
    if (mission.company) completenessCount++;
    if (mission.duration) completenessCount++;
    if (mission.tjm) completenessCount++;
    if (mission.workType) completenessCount++;
    const completenessScore = Math.round((completenessCount / 5) * 10);
    return {
      score: completenessScore,
      breakdown: {
        skills: { score: 0, max: 40, matched: [] },
        tjm: { score: 0, max: 20 },
        workType: { score: 0, max: 15 },
        location: { score: 0, max: 15 },
        completeness: { score: completenessScore, max: 10 },
      },
    };
  }

  const skills = Array.isArray(profile.skills)
    ? (profile.skills as { name: string; level: string; yearsExp?: number }[])
    : [];

  return scoreMission(mission, {
    skills,
    tjmTarget: profile.tjmTarget,
    workTypePreference: profile.workTypePreference,
    zone: profile.zone,
  });
}
