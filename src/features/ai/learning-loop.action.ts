"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { computeRecommendations } from "./learning-loop";

export const getRecommendationsAction = authAction.action(
  async ({ ctx: { user } }) => {
    const recommendations = await prisma.aIRecommendation.findMany({
      where: {
        userId: user.id,
        dismissedAt: null,
      },
      orderBy: { score: "desc" },
    });

    return recommendations;
  },
);

export const refreshRecommendationsAction = authAction.action(
  async ({ ctx: { user } }) => {
    const newRecommendations = await computeRecommendations(user.id);

    await prisma.aIRecommendation.deleteMany({
      where: {
        userId: user.id,
        dismissedAt: null,
        actedOnAt: null,
      },
    });

    if (newRecommendations.length > 0) {
      await prisma.aIRecommendation.createMany({
        data: newRecommendations.map((r) => ({
          userId: user.id,
          type: r.type,
          title: r.title,
          description: r.description,
          score: r.score,
          data: r.data ? JSON.parse(JSON.stringify(r.data)) : undefined,
        })),
      });
    }

    return prisma.aIRecommendation.findMany({
      where: {
        userId: user.id,
        dismissedAt: null,
      },
      orderBy: { score: "desc" },
    });
  },
);

export const dismissRecommendationAction = authAction
  .inputSchema(z.object({ id: z.string() }))
  .action(async ({ parsedInput: { id }, ctx: { user } }) => {
    await prisma.aIRecommendation.updateMany({
      where: { id, userId: user.id },
      data: { dismissedAt: new Date() },
    });

    return { success: true };
  });

export const actOnRecommendationAction = authAction
  .inputSchema(z.object({ id: z.string() }))
  .action(async ({ parsedInput: { id }, ctx: { user } }) => {
    await prisma.aIRecommendation.updateMany({
      where: { id, userId: user.id },
      data: { actedOnAt: new Date() },
    });

    return { success: true };
  });
