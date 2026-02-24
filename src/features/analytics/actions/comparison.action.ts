"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { computeDateRange, getAnalyticsHistoryDaysForUser } from "./shared";

const comparisonInputSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
});

export const getComparisonDataAction = authAction
  .inputSchema(comparisonInputSchema)
  .action(async ({ parsedInput: { startDate, endDate }, ctx: { user } }) => {
    const historyDays = await getAnalyticsHistoryDaysForUser(user.id);
    const dateRange = computeDateRange(historyDays, startDate, endDate);
    const currentStart = dateRange?.gte ?? new Date(startDate);
    const currentEnd = dateRange?.lte ?? new Date(endDate);
    const duration = currentEnd.getTime() - currentStart.getTime();
    const previousEnd = new Date(currentStart.getTime() - 1);
    const previousStart = new Date(previousEnd.getTime() - duration);

    type MetricsData = {
      totalMissions: number;
      conversionRate: number;
      avgTjm: number;
      followUpsCompleted: number;
    };

    const fetchMetrics = async (
      start: Date,
      end: Date,
    ): Promise<MetricsData> => {
      const range = { gte: start, lte: end };

      const funnelData = await prisma.mission.groupBy({
        by: ["status"],
        where: {
          userId: user.id,
          deletedAt: null,
          createdAt: range,
        },
        _count: true,
      });

      const totalMissions = funnelData.reduce((sum, s) => sum + s._count, 0);
      const acceptedCount =
        funnelData.find((s) => s.status === "ACCEPTE")?._count ?? 0;
      const conversionRate =
        totalMissions > 0
          ? Math.round((acceptedCount / totalMissions) * 100)
          : 0;

      const tjmData = await prisma.mission.groupBy({
        by: ["status"],
        where: {
          userId: user.id,
          deletedAt: null,
          status: "ACCEPTE",
          createdAt: range,
          tjm: { not: null },
        },
        _avg: { tjm: true },
      });

      const avgTjm = tjmData[0]?._avg.tjm ? Math.round(tjmData[0]._avg.tjm) : 0;

      const followUps = await prisma.followUp.count({
        where: {
          mission: {
            userId: user.id,
            deletedAt: null,
          },
          completedAt: range,
        },
      });

      return {
        totalMissions,
        conversionRate,
        avgTjm,
        followUpsCompleted: followUps,
      };
    };

    const current = await fetchMetrics(currentStart, currentEnd);
    const previous = await fetchMetrics(previousStart, previousEnd);

    const deltaPercent = (curr: number, prev: number): number => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return Math.round(((curr - prev) / prev) * 100);
    };

    return {
      current,
      previous,
      deltas: {
        missions: deltaPercent(current.totalMissions, previous.totalMissions),
        conversionRate: current.conversionRate - previous.conversionRate,
        avgTjm: deltaPercent(current.avgTjm, previous.avgTjm),
        followUps: deltaPercent(
          current.followUpsCompleted,
          previous.followUpsCompleted,
        ),
      },
    };
  });
