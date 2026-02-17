"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { checkPlanLimit } from "@/lib/plan-limits";

export const checkAllLimitsAction = authAction.action(
  async ({ ctx: { user } }) => {
    const [missions, contacts, profiles] = await Promise.all([
      checkPlanLimit(user.id, "missions"),
      checkPlanLimit(user.id, "contacts"),
      checkPlanLimit(user.id, "profiles"),
    ]);

    return { missions, contacts, profiles };
  },
);
