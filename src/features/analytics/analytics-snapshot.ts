import { prisma } from "@/lib/prisma";
import { calculatePipelineHealth } from "@/features/analytics/pipeline-health";

export type SnapshotData = {
  totalMissions: number;
  newMissions24h: number;
  conversionRate: number;
  avgTjm: number;
  followUpsCompleted24h: number;
  activePlatforms: number;
  pipelineHealthScore: number;
};

export async function captureSnapshot(userId: string): Promise<SnapshotData> {
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [
    totalMissions,
    newMissions24h,
    acceptedMissions,
    tjmResult,
    followUpsCompleted24h,
    activePlatforms,
    pipelineHealth,
  ] = await Promise.all([
    prisma.mission.count({
      where: { userId, deletedAt: null },
    }),
    prisma.mission.count({
      where: {
        userId,
        deletedAt: null,
        createdAt: { gte: twentyFourHoursAgo },
      },
    }),
    prisma.mission.count({
      where: { userId, deletedAt: null, status: "ACCEPTE" },
    }),
    prisma.mission.aggregate({
      where: { userId, deletedAt: null, tjm: { gt: 0 } },
      _avg: { tjm: true },
    }),
    prisma.followUp.count({
      where: {
        userId,
        completedAt: { gte: twentyFourHoursAgo },
      },
    }),
    prisma.userPlatform.count({
      where: { userId },
    }),
    calculatePipelineHealth(userId),
  ]);

  const conversionRate =
    totalMissions > 0
      ? Math.round((acceptedMissions / totalMissions) * 100)
      : 0;

  return {
    totalMissions,
    newMissions24h,
    conversionRate,
    avgTjm: Math.round(tjmResult._avg.tjm ?? 0),
    followUpsCompleted24h,
    activePlatforms,
    pipelineHealthScore: pipelineHealth.score,
  };
}
