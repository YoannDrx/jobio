"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { getPlanLimits } from "@/lib/auth/stripe/auth-plans";
import { prisma } from "@/lib/prisma";
import { RESPONDED_STATUS_VALUES } from "@/features/missions/mission-status";
import { computeDateRange, dateRangeSchema } from "./shared";

export const getResponseRateByPlatformAction = authAction
  .inputSchema(dateRangeSchema)
  .action(async ({ parsedInput: { startDate, endDate }, ctx: { user } }) => {
    const subscription = await prisma.subscription.findUnique({
      where: { referenceId: user.id },
    });
    const limits = getPlanLimits(subscription?.plan);
    const historyDays = limits.analyticsHistoryDays;
    const dateRange = computeDateRange(historyDays, startDate, endDate);

    const [missionsByPlatform, platforms] = await Promise.all([
      prisma.mission.groupBy({
        by: ["platformId", "status"],
        where: {
          userId: user.id,
          deletedAt: null,
          platformId: { not: null },
          createdAt: dateRange,
        },
        _count: true,
      }),
      prisma.platform.findMany({
        where: {
          userPlatforms: {
            some: { userId: user.id },
          },
        },
        select: { id: true, name: true },
      }),
    ]);

    const platformMap = new Map(platforms.map((p) => [p.id, p.name]));
    const respondedStatuses = new Set<string>(RESPONDED_STATUS_VALUES);

    const aggregated = new Map<string, { total: number; responded: number }>();

    for (const row of missionsByPlatform) {
      if (!row.platformId) continue;
      const entry = aggregated.get(row.platformId) ?? {
        total: 0,
        responded: 0,
      };
      entry.total += row._count;
      if (respondedStatuses.has(row.status)) {
        entry.responded += row._count;
      }
      aggregated.set(row.platformId, entry);
    }

    return Array.from(aggregated.entries())
      .filter(([, data]) => data.total > 0)
      .map(([platformId, data]) => ({
        platform: platformMap.get(platformId) ?? "Inconnu",
        total: data.total,
        responded: data.responded,
        rate:
          data.total > 0 ? Math.round((data.responded / data.total) * 100) : 0,
      }));
  });

export const getWinRateByPlatformAction = authAction
  .inputSchema(dateRangeSchema)
  .action(async ({ parsedInput: { startDate, endDate }, ctx: { user } }) => {
    const subscription = await prisma.subscription.findUnique({
      where: { referenceId: user.id },
    });
    const limits = getPlanLimits(subscription?.plan);
    const historyDays = limits.analyticsHistoryDays;
    const dateRange = computeDateRange(historyDays, startDate, endDate);

    const [missionsByPlatform, platforms] = await Promise.all([
      prisma.mission.groupBy({
        by: ["platformId", "status"],
        where: {
          userId: user.id,
          deletedAt: null,
          platformId: { not: null },
          createdAt: dateRange,
        },
        _count: true,
        _avg: { tjm: true },
      }),
      prisma.platform.findMany({
        where: {
          userPlatforms: {
            some: { userId: user.id },
          },
        },
        select: { id: true, name: true },
      }),
    ]);

    const platformMap = new Map(platforms.map((p) => [p.id, p.name]));
    const aggregated = new Map<
      string,
      { total: number; accepted: number; tjmSum: number; tjmCount: number }
    >();

    for (const row of missionsByPlatform) {
      if (!row.platformId) continue;
      const entry = aggregated.get(row.platformId) ?? {
        total: 0,
        accepted: 0,
        tjmSum: 0,
        tjmCount: 0,
      };
      entry.total += row._count;
      if (row.status === "ACCEPTE") {
        entry.accepted += row._count;
        if (row._avg.tjm) {
          entry.tjmSum += row._avg.tjm * row._count;
          entry.tjmCount += row._count;
        }
      }
      aggregated.set(row.platformId, entry);
    }

    return Array.from(aggregated.entries())
      .filter(([, data]) => data.total > 0)
      .map(([platformId, data]) => ({
        platform: platformMap.get(platformId) ?? "Inconnu",
        total: data.total,
        accepted: data.accepted,
        winRate:
          data.total > 0 ? Math.round((data.accepted / data.total) * 100) : 0,
        avgTjm: data.tjmCount > 0 ? Math.round(data.tjmSum / data.tjmCount) : 0,
      }));
  });
