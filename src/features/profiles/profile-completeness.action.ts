"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { prisma } from "@/lib/prisma";
import {
  calculateProfileCompleteness,
  FIELD_LABELS,
} from "@/features/profiles/profile-completeness";

const FIELD_WEIGHTS: Record<string, number> = {
  name: 10,
  headline: 15,
  bio: 10,
  skills: 15,
  experiences: 20,
  education: 5,
  certifications: 5,
  languages: 5,
  tjmTarget: 10,
  zone: 5,
};

export const getProfileCompletenessAction = authAction.action(
  async ({ ctx: { user } }) => {
    let profile = await prisma.userProfile.findFirst({
      where: { userId: user.id, isDefault: true },
    });

    profile ??= await prisma.userProfile.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
    });

    if (!profile) {
      return {
        score: 0,
        missingFields: Object.entries(FIELD_LABELS).map(([key, label]) => ({
          key,
          label,
          weight: FIELD_WEIGHTS[key] ?? 0,
        })),
      };
    }

    return calculateProfileCompleteness(profile);
  },
);
