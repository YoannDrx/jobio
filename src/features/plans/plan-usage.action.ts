"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { resolvePlanLimitsForUser } from "@/lib/auth/stripe/plan-entitlements";
import { checkPlanLimit } from "@/lib/plan-limits";

export const getPlanUsageAction = authAction.action(
  async ({ ctx: { user } }) => {
    const { plan, limits } = await resolvePlanLimitsForUser(user.id);
    const [
      missions,
      contacts,
      aiRequests,
      cvDocuments,
      sequences,
      messageTemplates,
    ] = await Promise.all([
      checkPlanLimit(user.id, "missions", { plan, limits }),
      checkPlanLimit(user.id, "contacts", { plan, limits }),
      checkPlanLimit(user.id, "aiRequestsPerMonth", { plan, limits }),
      checkPlanLimit(user.id, "cvDocuments", { plan, limits }),
      checkPlanLimit(user.id, "sequences", { plan, limits }),
      checkPlanLimit(user.id, "messageTemplates", { plan, limits }),
    ]);

    return {
      missions,
      contacts,
      aiRequests,
      cvDocuments,
      sequences,
      messageTemplates,
    };
  },
);
