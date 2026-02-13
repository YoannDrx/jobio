import { prisma } from "@/lib/prisma";

type PipelineHealthMetric = {
  label: string;
  score: number;
  maxScore: number;
};

type PipelineHealthResult = {
  score: number;
  metrics: PipelineHealthMetric[];
};

export async function calculatePipelineHealth(
  userId: string,
): Promise<PipelineHealthResult> {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const activeMissions = await prisma.mission.findMany({
    where: {
      userId,
      deletedAt: null,
      status: {
        notIn: ["REFUSE", "ABANDONNE", "ARCHIVE"],
      },
    },
    select: {
      id: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      followUps: {
        where: {
          completedAt: { not: null },
        },
        orderBy: { completedAt: "desc" },
        take: 1,
        select: { completedAt: true },
      },
    },
  });

  // a. Activite recente (25pts) : missions creees dans les 7 derniers jours
  const recentMissions = activeMissions.filter(
    (m) => m.createdAt >= sevenDaysAgo,
  );
  const recentCount = recentMissions.length;
  const recentActivityScore =
    recentCount >= 3 ? 25 : recentCount === 2 ? 16 : recentCount === 1 ? 8 : 0;

  // b. Missions non-stale (25pts) : % de missions actives MAJ dans les 14 derniers jours
  const totalActive = activeMissions.length;
  const freshMissions = activeMissions.filter(
    (m) => m.updatedAt >= fourteenDaysAgo,
  );
  const freshRatio = totalActive > 0 ? freshMissions.length / totalActive : 0;
  const freshScore = Math.round(freshRatio * 25);

  // c. Taux follow-up (25pts) : % de missions POSTULE/ENTRETIEN avec follow-up recent (<7j)
  const followUpMissions = activeMissions.filter(
    (m) => m.status === "POSTULE" || m.status === "ENTRETIEN",
  );
  const missionsWithRecentFollowUp = followUpMissions.filter((m) => {
    const lastFollowUp = m.followUps[0]?.completedAt;
    return lastFollowUp && lastFollowUp >= sevenDaysAgo;
  });
  const followUpRatio =
    followUpMissions.length > 0
      ? missionsWithRecentFollowUp.length / followUpMissions.length
      : 0;
  const followUpScore = Math.round(followUpRatio * 25);

  // d. Diversite pipeline (25pts) : missions dans au moins 3 statuts differents
  const uniqueStatuses = new Set(activeMissions.map((m) => m.status));
  const statusCount = uniqueStatuses.size;
  const diversityScore =
    statusCount >= 3 ? 25 : statusCount === 2 ? 16 : statusCount === 1 ? 8 : 0;

  const totalScore =
    recentActivityScore + freshScore + followUpScore + diversityScore;

  return {
    score: totalScore,
    metrics: [
      {
        label: "Activite recente",
        score: recentActivityScore,
        maxScore: 25,
      },
      {
        label: "Missions a jour",
        score: freshScore,
        maxScore: 25,
      },
      {
        label: "Taux de follow-up",
        score: followUpScore,
        maxScore: 25,
      },
      {
        label: "Diversite pipeline",
        score: diversityScore,
        maxScore: 25,
      },
    ],
  };
}
