"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const getOnboardingStatusAction = authAction.action(
  async ({ ctx: { user } }) => {
    const [profileCount, platformCount, missionCount, sequenceCount, userData] =
      await Promise.all([
        prisma.userProfile.count({
          where: { userId: user.id },
        }),
        prisma.userPlatform.count({
          where: { userId: user.id },
        }),
        prisma.mission.count({
          where: { userId: user.id, deletedAt: null },
        }),
        prisma.sequence.count({
          where: { userId: user.id },
        }),
        prisma.user.findUnique({
          where: { id: user.id },
          select: { onboardingDismissed: true },
        }),
      ]);

    return {
      hasProfile: profileCount > 0,
      hasPlatforms: platformCount > 0,
      hasMission: missionCount > 0,
      hasSequence: sequenceCount > 0,
      isDismissed: userData?.onboardingDismissed ?? false,
      isComplete:
        profileCount > 0 &&
        platformCount > 0 &&
        missionCount > 0 &&
        sequenceCount > 0,
    };
  },
);

export const dismissOnboardingAction = authAction
  .inputSchema(z.void())
  .action(async ({ ctx: { user } }) => {
    await prisma.user.update({
      where: { id: user.id },
      data: { onboardingDismissed: true },
    });
    return { success: true };
  });
