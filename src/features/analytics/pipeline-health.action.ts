"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { calculatePipelineHealth } from "./pipeline-health";

export const getPipelineHealthAction = authAction.action(
  async ({ ctx: { user } }) => {
    return calculatePipelineHealth(user.id);
  },
);
