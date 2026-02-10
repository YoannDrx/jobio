"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { getPlanLimits } from "@/lib/auth/stripe/auth-plans";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const dateRangeSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

function computeDateRange(
  historyDays: number,
  startDate?: string,
  endDate?: string,
): { gte: Date; lte?: Date } {
  const maxStart = new Date();
  maxStart.setDate(maxStart.getDate() - historyDays);

  if (startDate) {
    const requestedStart = new Date(startDate);
    const clampedStart = requestedStart < maxStart ? maxStart : requestedStart;
    const result: { gte: Date; lte?: Date } = { gte: clampedStart };
    if (endDate) {
      result.lte = new Date(endDate);
    }
    return result;
  }

  return { gte: maxStart };
}

export const getFunnelDataAction = authAction
  .inputSchema(dateRangeSchema)
  .action(async ({ parsedInput: { startDate, endDate }, ctx: { user } }) => {
    const subscription = await prisma.subscription.findUnique({
      where: { referenceId: user.id },
    });
    const limits = getPlanLimits(subscription?.plan);
    const historyDays = limits.analyticsHistoryDays;
    const dateRange = computeDateRange(historyDays, startDate, endDate);

    const funnelData = await prisma.mission.groupBy({
      by: ["status"],
      where: {
        userId: user.id,
        deletedAt: null,
        createdAt: dateRange,
      },
      _count: true,
    });

    return funnelData.map((item) => ({
      status: item.status,
      count: item._count,
    }));
  });

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
    const RESPONDED_STATUSES = new Set(["ENTRETIEN", "PROPOSITION", "ACCEPTE"]);

    const aggregated = new Map<string, { total: number; responded: number }>();

    for (const row of missionsByPlatform) {
      if (!row.platformId) continue;
      const entry = aggregated.get(row.platformId) ?? {
        total: 0,
        responded: 0,
      };
      entry.total += row._count;
      if (RESPONDED_STATUSES.has(row.status)) {
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

export const getAverageTJMAction = authAction
  .inputSchema(dateRangeSchema)
  .action(async ({ parsedInput: { startDate, endDate }, ctx: { user } }) => {
    const subscription = await prisma.subscription.findUnique({
      where: { referenceId: user.id },
    });
    const limits = getPlanLimits(subscription?.plan);
    const historyDays = limits.analyticsHistoryDays;
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

export const getWeeklyActivityAction = authAction
  .inputSchema(dateRangeSchema)
  .action(async ({ parsedInput: { startDate, endDate }, ctx: { user } }) => {
    const subscription = await prisma.subscription.findUnique({
      where: { referenceId: user.id },
    });
    const limits = getPlanLimits(subscription?.plan);
    const historyDays = limits.analyticsHistoryDays;
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
        mission: { userId: user.id },
        completedAt: { not: null },
        createdAt: dateRange,
      },
      select: { createdAt: true },
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
      const week = getWeekKey(f.createdAt);
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

export const getAnalyticsLimitsAction = authAction.action(
  async ({ ctx: { user } }) => {
    const subscription = await prisma.subscription.findUnique({
      where: { referenceId: user.id },
    });
    const planName = subscription?.plan ?? "free";
    const limits = getPlanLimits(planName);
    return {
      analyticsHistoryDays: limits.analyticsHistoryDays,
      planName,
    };
  },
);

export const getEarningsDataAction = authAction
  .inputSchema(dateRangeSchema)
  .action(async ({ parsedInput: { startDate, endDate }, ctx: { user } }) => {
    const subscription = await prisma.subscription.findUnique({
      where: { referenceId: user.id },
    });
    const limits = getPlanLimits(subscription?.plan);
    const historyDays = limits.analyticsHistoryDays;
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

    // Projection mensuelle : revenus / nombre de mois d'activité
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

function getWeekKey(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().split("T")[0] ?? "";
}

function parseDurationToDays(duration: string | null): number {
  if (!duration) return 20; // défaut : 1 mois de travail
  const lower = duration.toLowerCase().trim();

  // "6 mois", "3 mois"
  const monthsMatch = lower.match(/(\d+)\s*mois/);
  if (monthsMatch) return parseInt(monthsMatch[1], 10) * 20;

  // "1 an", "2 ans"
  const yearsMatch = lower.match(/(\d+)\s*an/);
  if (yearsMatch) return parseInt(yearsMatch[1], 10) * 220;

  // "30 jours", "60j"
  const daysMatch = lower.match(/(\d+)\s*j/);
  if (daysMatch) return parseInt(daysMatch[1], 10);

  // "2 semaines"
  const weeksMatch = lower.match(/(\d+)\s*semaine/);
  if (weeksMatch) return parseInt(weeksMatch[1], 10) * 5;

  return 20;
}
