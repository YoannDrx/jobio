"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { calculateInsights } from "@/features/analytics/ai-insights";

export const getAIInsightsAction = authAction.action(
  async ({ ctx: { user } }) => {
    return calculateInsights(user.id);
  },
);
