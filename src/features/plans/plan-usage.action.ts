"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { checkPlanLimit } from "@/lib/plan-limits";

export const getPlanUsageAction = authAction.action(
  async ({ ctx: { user } }) => {
    const [missions, contacts, aiRequests, cvDocuments, sequences, messageTemplates] =
      await Promise.all([
        checkPlanLimit(user.id, "missions"),
        checkPlanLimit(user.id, "contacts"),
        checkPlanLimit(user.id, "aiRequestsPerMonth"),
        checkPlanLimit(user.id, "cvDocuments"),
        checkPlanLimit(user.id, "sequences"),
        checkPlanLimit(user.id, "messageTemplates"),
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
