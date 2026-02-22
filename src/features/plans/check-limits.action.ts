"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { resolvePlanLimitsForUser } from "@/lib/auth/stripe/plan-entitlements";
import { checkPlanLimit } from "@/lib/plan-limits";

export const checkAllLimitsAction = authAction.action(
  async ({ ctx: { user } }) => {
    const { plan, limits } = await resolvePlanLimitsForUser(user.id);
    const [missions, contacts, profiles] = await Promise.all([
      checkPlanLimit(user.id, "missions", { plan, limits }),
      checkPlanLimit(user.id, "contacts", { plan, limits }),
      checkPlanLimit(user.id, "profiles", { plan, limits }),
    ]);

    return { missions, contacts, profiles, plan, limits };
  },
);

export const getCurrentPlanAction = authAction.action(async ({ ctx: { user } }) => {
  const { plan } = await resolvePlanLimitsForUser(user.id);
  return {
    plan,
  };
});
