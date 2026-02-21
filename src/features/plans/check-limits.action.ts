"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { getPlanLimits } from "@/lib/auth/stripe/auth-plans";
import { checkPlanLimit } from "@/lib/plan-limits";
import { prisma } from "@/lib/prisma";

export const checkAllLimitsAction = authAction.action(
  async ({ ctx: { user } }) => {
    const subscription = await prisma.subscription.findUnique({
      where: { referenceId: user.id },
      select: { plan: true },
    });

    const plan = subscription?.plan ?? "free";
    const limits = getPlanLimits(plan);
    const [missions, contacts, profiles] = await Promise.all([
      checkPlanLimit(user.id, "missions", { plan, limits }),
      checkPlanLimit(user.id, "contacts", { plan, limits }),
      checkPlanLimit(user.id, "profiles", { plan, limits }),
    ]);

    return { missions, contacts, profiles, plan };
  },
);

export const getCurrentPlanAction = authAction.action(async ({ ctx: { user } }) => {
  const subscription = await prisma.subscription.findUnique({
    where: { referenceId: user.id },
    select: { plan: true },
  });

  return {
    plan: subscription?.plan ?? "free",
  };
});
