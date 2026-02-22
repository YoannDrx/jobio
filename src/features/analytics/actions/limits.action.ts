"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { resolvePlanLimitsForUser } from "@/lib/auth/stripe/plan-entitlements";

export const getAnalyticsLimitsAction = authAction.action(
  async ({ ctx: { user } }) => {
    const { plan, limits } = await resolvePlanLimitsForUser(user.id);
    return {
      analyticsHistoryDays: limits.analyticsHistoryDays,
      planName: plan,
    };
  },
);
