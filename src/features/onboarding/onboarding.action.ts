"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { prisma } from "@/lib/prisma";

export const getOnboardingStatusAction = authAction.action(
  async ({ ctx: { user } }) => {
    const [profileCount, platformCount, missionCount] = await Promise.all([
      prisma.userProfile.count({
        where: { userId: user.id },
      }),
      prisma.userPlatform.count({
        where: { userId: user.id },
      }),
      prisma.mission.count({
        where: { userId: user.id, deletedAt: null },
      }),
    ]);

    return {
      hasProfile: profileCount > 0,
      hasPlatforms: platformCount > 0,
      hasMission: missionCount > 0,
      isComplete: profileCount > 0 && platformCount > 0 && missionCount > 0,
    };
  },
);
