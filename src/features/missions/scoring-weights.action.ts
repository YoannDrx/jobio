"use server";

import { prisma } from "@/lib/prisma";
import { authAction } from "@/lib/actions/safe-actions";
import { ApplicationError } from "@/lib/errors/application-error";
import type { ScoringWeights } from "./mission-scoring";
import { z } from "zod";

const ScoringWeightsSchema = z.object({
  skills: z.number().min(0).max(100),
  tjm: z.number().min(0).max(100),
  workType: z.number().min(0).max(100),
  location: z.number().min(0).max(100),
  completeness: z.number().min(0).max(100),
});

const UpdateScoringWeightsInputSchema = z.object({
  profileId: z.string(),
  weights: ScoringWeightsSchema,
});

export const updateScoringWeightsAction = authAction
  .inputSchema(UpdateScoringWeightsInputSchema)
  .action(async ({ parsedInput: { profileId, weights }, ctx: { user } }) => {
    // Validate that total doesn't exceed 100
    const total = Object.values(weights).reduce((sum, val) => sum + val, 0);
    if (total > 100) {
      throw new ApplicationError(
        `La somme des poids ne peut pas dépasser 100 (actuellement ${total})`,
      );
    }

    // Verify ownership of profile
    const profile = await prisma.userProfile.findFirst({
      where: { id: profileId, userId: user.id },
    });

    if (!profile) {
      throw new ApplicationError("Profil non trouvé");
    }

    // Update profile with new weights
    const updated = await prisma.userProfile.update({
      where: { id: profileId },
      data: {
        scoringWeights: weights as ScoringWeights,
      },
      select: {
        id: true,
        scoringWeights: true,
      },
    });

    return {
      weights: updated.scoringWeights as ScoringWeights,
    };
  });

const GetScoringWeightsInputSchema = z.object({
  profileId: z.string().optional(),
});

export const getScoringWeightsAction = authAction
  .inputSchema(GetScoringWeightsInputSchema)
  .action(async ({ parsedInput: { profileId }, ctx: { user } }) => {
    const profile = profileId
      ? await prisma.userProfile.findFirst({
          where: { id: profileId, userId: user.id },
          select: { scoringWeights: true },
        })
      : await prisma.userProfile.findFirst({
          where: { userId: user.id, isDefault: true },
          select: { scoringWeights: true },
        });

    if (!profile) {
      throw new ApplicationError("Profil non trouvé");
    }

    return {
      weights: profile.scoringWeights as ScoringWeights | null,
    };
  });
