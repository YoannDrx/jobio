"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const getPreferencesAction = authAction.action(
  async ({ ctx: { user } }) => {
    const prefs = await prisma.userPreference.upsert({
      where: { userId: user.id },
      create: { userId: user.id },
      update: {},
    });

    return prefs;
  },
);

export const updatePreferencesAction = authAction
  .inputSchema(
    z.object({
      locale: z.string().optional(),
      theme: z.string().optional(),
      notifyFollowUpDue: z.boolean().optional(),
      notifyMissionStale: z.boolean().optional(),
      notifyAiQuota: z.boolean().optional(),
      weeklyDigest: z.boolean().optional(),
      pushFollowUpDue: z.boolean().optional(),
      pushMissionStale: z.boolean().optional(),
      pushAiQuota: z.boolean().optional(),
      pushWeeklyDigest: z.boolean().optional(),
    }),
  )
  .action(async ({ parsedInput, ctx: { user } }) => {
    const prefs = await prisma.userPreference.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        ...parsedInput,
      },
      update: parsedInput,
    });

    return prefs;
  });
