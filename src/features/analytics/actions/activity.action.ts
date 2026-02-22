"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { prisma } from "@/lib/prisma";
import {
  computeDateRange,
  dateRangeSchema,
  getAnalyticsHistoryDaysForUser,
  getWeekKey,
} from "./shared";

export const getWeeklyActivityAction = authAction
  .inputSchema(dateRangeSchema)
  .action(async ({ parsedInput: { startDate, endDate }, ctx: { user } }) => {
    const historyDays = await getAnalyticsHistoryDaysForUser(user.id);
    const dateRange = computeDateRange(historyDays, startDate, endDate);

    const missions = await prisma.mission.findMany({
      where: {
        userId: user.id,
        deletedAt: null,
        createdAt: dateRange,
      },
      select: { createdAt: true },
    });

    const followUps = await prisma.followUp.findMany({
      where: {
        mission: {
          userId: user.id,
          deletedAt: null,
        },
        completedAt: {
          not: null,
          ...(dateRange ? { gte: dateRange.gte } : {}),
          ...(dateRange?.lte ? { lte: dateRange.lte } : {}),
        },
      },
      select: { completedAt: true },
    });

    const weeklyMap = new Map<
      string,
      { missions: number; followUps: number }
    >();

    missions.forEach((m) => {
      const week = getWeekKey(m.createdAt);
      const entry = weeklyMap.get(week) ?? { missions: 0, followUps: 0 };
      entry.missions += 1;
      weeklyMap.set(week, entry);
    });

    followUps.forEach((f) => {
      if (!f.completedAt) return;
      const week = getWeekKey(f.completedAt);
      const entry = weeklyMap.get(week) ?? { missions: 0, followUps: 0 };
      entry.followUps += 1;
      weeklyMap.set(week, entry);
    });

    const weeklyData = Array.from(weeklyMap.entries())
      .sort(([weekA], [weekB]) => weekA.localeCompare(weekB))
      .map(([week, data]) => ({
        week,
        missions: data.missions,
        followUps: data.followUps,
      }));

    return weeklyData;
  });
