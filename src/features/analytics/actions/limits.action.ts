"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { getPlanLimits } from "@/lib/auth/stripe/auth-plans";
import { prisma } from "@/lib/prisma";

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
