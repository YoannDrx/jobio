"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { checkPlanLimit } from "@/lib/plan-limits";
import { prisma } from "@/lib/prisma";

export const checkAllLimitsAction = authAction.action(
  async ({ ctx: { user } }) => {
    const [missions, contacts, profiles, subscription] = await Promise.all([
      checkPlanLimit(user.id, "missions"),
      checkPlanLimit(user.id, "contacts"),
      checkPlanLimit(user.id, "profiles"),
      prisma.subscription.findUnique({
        where: { referenceId: user.id },
        select: { plan: true },
      }),
    ]);

    const plan = subscription?.plan ?? "free";

    return { missions, contacts, profiles, plan };
  },
);
