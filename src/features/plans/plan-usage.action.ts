"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { checkPlanLimit } from "@/lib/plan-limits";

export const getPlanUsageAction = authAction.action(
  async ({ ctx: { user } }) => {
    const [missions, contacts, aiRequests] = await Promise.all([
      checkPlanLimit(user.id, "missions"),
      checkPlanLimit(user.id, "contacts"),
      checkPlanLimit(user.id, "aiRequestsPerMonth"),
    ]);

    return { missions, contacts, aiRequests };
  },
);
