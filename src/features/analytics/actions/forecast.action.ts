"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { z } from "zod";
import { computeRevenueForecast } from "../revenue-forecast-engine";

export const getAdvancedRevenueForecastAction = authAction
  .inputSchema(z.object({}))
  .action(async ({ ctx: { user } }) => {
    return computeRevenueForecast(user.id);
  });
