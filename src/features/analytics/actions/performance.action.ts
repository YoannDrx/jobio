"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { prisma } from "@/lib/prisma";
import {
  computeDateRange,
  dateRangeSchema,
  getAnalyticsHistoryDaysForUser,
} from "./shared";

export const getWinRateByStackAction = authAction
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
      select: { stack: true, status: true },
    });

    const techStats = new Map<string, { total: number; accepted: number }>();

    for (const mission of missions) {
      if (mission.stack.length === 0) continue;
      for (const tech of mission.stack) {
        const stats = techStats.get(tech) ?? { total: 0, accepted: 0 };
        stats.total += 1;
        if (mission.status === "ACCEPTE") {
          stats.accepted += 1;
        }
        techStats.set(tech, stats);
      }
    }

    const results = Array.from(techStats.entries())
      .map(([tech, stats]) => ({
        tech,
        total: stats.total,
        accepted: stats.accepted,
        winRate:
          stats.total > 0
            ? Math.round((stats.accepted / stats.total) * 100)
            : 0,
      }))
      .sort((a, b) => b.winRate - a.winRate)
      .slice(0, 10);

    return results;
  });

export const getTimeToHireAction = authAction
  .inputSchema(dateRangeSchema)
  .action(async ({ parsedInput: { startDate, endDate }, ctx: { user } }) => {
    const historyDays = await getAnalyticsHistoryDaysForUser(user.id);
    const dateRange = computeDateRange(historyDays, startDate, endDate);

    const acceptedMissions = await prisma.mission.findMany({
      where: {
        userId: user.id,
        deletedAt: null,
        status: "ACCEPTE",
        createdAt: dateRange,
      },
      select: { createdAt: true, updatedAt: true },
    });

    if (acceptedMissions.length === 0) {
      return {
        avgDays: 0,
        minDays: 0,
        maxDays: 0,
        count: 0,
      };
    }

    const durations = acceptedMissions.map((m) => {
      const diffMs = m.updatedAt.getTime() - m.createdAt.getTime();
      return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    });

    const avgDays = Math.round(
      durations.reduce((a, b) => a + b, 0) / durations.length,
    );
    const minDays = Math.min(...durations);
    const maxDays = Math.max(...durations);

    return {
      avgDays,
      minDays,
      maxDays,
      count: acceptedMissions.length,
    };
  });

export const getPipelineVelocityAction = authAction
  .inputSchema(dateRangeSchema)
  .action(async ({ parsedInput: { startDate, endDate }, ctx: { user } }) => {
    const historyDays = await getAnalyticsHistoryDaysForUser(user.id);
    const dateRange = computeDateRange(historyDays, startDate, endDate);

    const statusChanges = await prisma.activityEvent.findMany({
      where: {
        userId: user.id,
        type: "STATUS_CHANGE",
        createdAt: dateRange,
      },
      select: {
        previousValue: true,
        newValue: true,
        createdAt: true,
        missionId: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const transitions = new Map<string, { dates: Date[]; avgDays: number }>();

    for (const change of statusChanges) {
      if (!change.previousValue || !change.newValue) continue;
      const key = `${change.previousValue}→${change.newValue}`;
      const entry = transitions.get(key) ?? { dates: [], avgDays: 0 };
      entry.dates.push(change.createdAt);
      transitions.set(key, entry);
    }

    const results = Array.from(transitions.entries()).map(([key, data]) => {
      const parts = key.split("→");
      const from = parts[0] ?? "";
      const to = parts[1] ?? "";
      let avgDays = 0;
      if (data.dates.length > 1) {
        const diffs = [];
        for (let i = 1; i < data.dates.length; i++) {
          const diffMs = data.dates[i].getTime() - data.dates[i - 1].getTime();
          diffs.push(Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
        }
        avgDays = Math.round(diffs.reduce((a, b) => a + b, 0) / diffs.length);
      }
      return {
        from,
        to,
        avgDays,
      };
    });

    return results;
  });
