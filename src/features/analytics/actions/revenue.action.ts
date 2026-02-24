"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { prisma } from "@/lib/prisma";
import {
  computeDateRange,
  dateRangeSchema,
  getAnalyticsHistoryDaysForUser,
  parseDurationToDays,
} from "./shared";

export const getEarningsDataAction = authAction
  .inputSchema(dateRangeSchema)
  .action(async ({ parsedInput: { startDate, endDate }, ctx: { user } }) => {
    const historyDays = await getAnalyticsHistoryDaysForUser(user.id);
    const dateRange = computeDateRange(historyDays, startDate, endDate);

    const acceptedMissions = await prisma.mission.findMany({
      where: {
        userId: user.id,
        deletedAt: null,
        status: "ACCEPTE",
        tjm: { not: null },
        createdAt: dateRange,
      },
      select: { tjm: true, duration: true, createdAt: true },
    });

    const totalAccepted = acceptedMissions.length;
    const avgTjm =
      totalAccepted > 0
        ? Math.round(
            acceptedMissions.reduce((sum, m) => sum + (m.tjm ?? 0), 0) /
              totalAccepted,
          )
        : 0;

    let totalEstimatedRevenue = 0;
    for (const mission of acceptedMissions) {
      const tjm = mission.tjm ?? 0;
      const days = parseDurationToDays(mission.duration);
      totalEstimatedRevenue += tjm * days;
    }

    const firstMission =
      acceptedMissions.length > 0
        ? acceptedMissions.reduce((earliest, m) =>
            m.createdAt < earliest.createdAt ? m : earliest,
          )
        : null;

    let monthlyProjection = 0;
    if (firstMission && totalEstimatedRevenue > 0) {
      const monthsDiff = Math.max(
        1,
        Math.ceil(
          (Date.now() - firstMission.createdAt.getTime()) /
            (1000 * 60 * 60 * 24 * 30),
        ),
      );
      monthlyProjection = Math.round(totalEstimatedRevenue / monthsDiff);
    }

    return {
      totalAccepted,
      avgTjm,
      totalEstimatedRevenue: Math.round(totalEstimatedRevenue),
      monthlyProjection,
    };
  });

export const getRevenueForecastAction = authAction
  .inputSchema(dateRangeSchema)
  .action(async ({ parsedInput: { startDate, endDate }, ctx: { user } }) => {
    const historyDays = await getAnalyticsHistoryDaysForUser(user.id);
    const dateRange = computeDateRange(historyDays, startDate, endDate);

    const missions = await prisma.mission.findMany({
      where: {
        userId: user.id,
        deletedAt: null,
        createdAt: dateRange,
        tjm: { not: null },
        duration: { not: null },
      },
      select: { status: true, tjm: true, duration: true },
    });

    const statusWeights: Record<string, number> = {
      A_POSTULER: 0.1,
      POSTULE: 0.2,
      ENTRETIEN: 0.5,
      PROPOSITION: 0.75,
      ACCEPTE: 1.0,
      REFUSE: 0,
      EN_PAUSE: 0.1,
      ABANDONNE: 0,
      ARCHIVE: 0,
    };

    const byStatus = new Map<string, { count: number; totalValue: number }>();

    for (const mission of missions) {
      const value = (mission.tjm ?? 0) * parseDurationToDays(mission.duration);
      const entry = byStatus.get(mission.status) ?? {
        count: 0,
        totalValue: 0,
      };
      entry.count += 1;
      entry.totalValue += value;
      byStatus.set(mission.status, entry);
    }

    let totalPipeline = 0;
    let weightedPipeline = 0;

    const results = Array.from(byStatus.entries()).map(([status, data]) => {
      const totalValue = Math.round(data.totalValue);
      const probability = statusWeights[status] ?? 0;
      const weightedValue = Math.round(totalValue * probability);
      totalPipeline += totalValue;
      weightedPipeline += weightedValue;

      return {
        status,
        count: data.count,
        totalValue,
        probability: Math.round(probability * 100),
        weightedValue,
      };
    });

    return {
      byStatus: results,
      totalPipeline,
      weightedPipeline,
    };
  });

export const getAverageTJMAction = authAction
  .inputSchema(dateRangeSchema)
  .action(async ({ parsedInput: { startDate, endDate }, ctx: { user } }) => {
    const historyDays = await getAnalyticsHistoryDaysForUser(user.id);
    const dateRange = computeDateRange(historyDays, startDate, endDate);

    const tjmByStatus = await prisma.mission.groupBy({
      by: ["status"],
      where: {
        userId: user.id,
        deletedAt: null,
        createdAt: dateRange,
        tjm: { not: null },
      },
      _avg: { tjm: true },
    });

    return tjmByStatus
      .filter(
        (item) => item.status === "PROPOSITION" || item.status === "ACCEPTE",
      )
      .map((item) => ({
        status: item.status,
        avgTjm: Math.round(item._avg.tjm ?? 0),
      }));
  });
