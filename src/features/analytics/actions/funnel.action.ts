"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { getPlanLimits } from "@/lib/auth/stripe/auth-plans";
import { prisma } from "@/lib/prisma";
import { MISSION_STATUS_VALUES } from "@/features/missions/mission-status";
import { computeDateRange, dateRangeSchema } from "./shared";

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

    const countByStatus = new Map(
      funnelData.map((item) => [item.status, item._count]),
    );

    return MISSION_STATUS_VALUES.map((status) => ({
      status,
      count: countByStatus.get(status) ?? 0,
    })).filter((item) => item.count > 0);
  });
