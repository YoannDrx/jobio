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

export function scoreMission(
  mission: MissionData,
  profile: ProfileData,
): number {
  let score = 0;

  // Skills match: +40 max
  if (mission.stack.length > 0 && profile.skills.length > 0) {
    const profileSkillNames = profile.skills.map((s) => s.name.toLowerCase());
    const matchCount = mission.stack.filter((tech) =>
      profileSkillNames.includes(tech.toLowerCase()),
    ).length;
    const matchRatio = matchCount / mission.stack.length;
    score += Math.round(matchRatio * 40);
  }

  // TJM match: +20 if within ±20%
  if (mission.tjm && profile.tjmTarget) {
    const ratio = mission.tjm / profile.tjmTarget;
    if (ratio >= 0.8 && ratio <= 1.2) {
      score += 20;
    } else if (ratio >= 0.6 && ratio <= 1.4) {
      score += 10;
    }
  }

  // WorkType match: +15
  if (mission.workType && profile.workTypePreference) {
    if (mission.workType === profile.workTypePreference) {
      score += 15;
    } else if (
      mission.workType === "HYBRID" ||
      profile.workTypePreference === "HYBRID"
    ) {
      score += 7;
    }
  }

  // Zone/Location match: +15
  if (mission.location && profile.zone) {
    const missionLoc = mission.location.toLowerCase();
    const profileZone = profile.zone.toLowerCase();
    if (missionLoc.includes(profileZone) || profileZone.includes(missionLoc)) {
      score += 15;
    }
  }

  // Info completeness: +10
  let completeness = 0;
  if (mission.description) completeness++;
  if (mission.company) completeness++;
  if (mission.duration) completeness++;
  if (mission.tjm) completeness++;
  if (mission.workType) completeness++;
  score += Math.round((completeness / 5) * 10);

  return Math.min(100, score);
}

export async function computeMissionScore(
  missionId: string,
  userId: string,
): Promise<number> {
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

  if (!mission) return 0;

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
    let completeness = 0;
    if (mission.description) completeness++;
    if (mission.company) completeness++;
    if (mission.duration) completeness++;
    if (mission.tjm) completeness++;
    if (mission.workType) completeness++;
    return Math.round((completeness / 5) * 10);
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
