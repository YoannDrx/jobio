"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { isFeatureEnabled } from "@/lib/ops/feature-flags";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const getOnboardingStatusAction = authAction.action(
  async ({ ctx: { user } }) => {
    const [
      profileCount,
      platformCount,
      missionCount,
      sequenceCount,
      contactCount,
      pendingOrCompletedFollowUpCount,
      sentEmailCount,
      userData,
      extendedChecklistEnabled,
    ] = await Promise.all([
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
        prisma.contact.count({
          where: { userId: user.id, deletedAt: null },
        }),
        prisma.followUp.count({
          where: { userId: user.id },
        }),
        prisma.sentEmail.count({
          where: { userId: user.id, isDraft: false },
        }),
        prisma.user.findUnique({
          where: { id: user.id },
          select: { onboardingDismissed: true },
        }),
        isFeatureEnabled("onboarding.extended_checklist"),
      ]);

    const hasProfile = profileCount > 0;
    const hasPlatforms = platformCount > 0;
    const hasMission = missionCount > 0;
    const hasSequence = sequenceCount > 0;
    const hasContact = contactCount > 0;
    const hasFollowUp = pendingOrCompletedFollowUpCount > 0;
    const hasSentEmail = sentEmailCount > 0;

    const essentialComplete =
      hasProfile && hasPlatforms && hasMission && hasSequence;
    const activationComplete = extendedChecklistEnabled
      ? essentialComplete && hasContact && hasFollowUp && hasSentEmail
      : essentialComplete;

    const completedSteps = extendedChecklistEnabled
      ? [
          hasProfile,
          hasPlatforms,
          hasMission,
          hasSequence,
          hasContact,
          hasFollowUp,
          hasSentEmail,
        ].filter(Boolean).length
      : [hasProfile, hasPlatforms, hasMission, hasSequence].filter(Boolean)
          .length;

    const totalSteps = extendedChecklistEnabled ? 7 : 4;

    return {
      hasProfile,
      hasPlatforms,
      hasMission,
      hasSequence,
      hasContact,
      hasFollowUp,
      hasSentEmail,
      essentialComplete,
      activationComplete,
      completedSteps,
      totalSteps,
      extendedChecklistEnabled,
      isDismissed: userData?.onboardingDismissed ?? false,
      isComplete: activationComplete,
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
