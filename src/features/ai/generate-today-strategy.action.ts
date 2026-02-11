"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { ApplicationError } from "@/lib/errors/application-error";
import { prisma } from "@/lib/prisma";
import { checkAndIncrementAIQuota } from "./ai-quota";
import { generateObject } from "ai";
import { AI_MODELS } from "./ai-config";
import { z } from "zod";
import { isFeatureEnabled } from "@/lib/ops/feature-flags";

const generateTodayStrategyInputSchema = z.object({});

const todayStrategyOutputSchema = z.object({
  summary: z.string().min(10).max(600),
  priorities: z.array(z.string().min(5).max(180)).min(2).max(5),
  quickWins: z.array(z.string().min(5).max(180)).max(4),
  risks: z.array(z.string().min(5).max(180)).max(4),
});

export const generateTodayStrategyAction = authAction
  .inputSchema(generateTodayStrategyInputSchema)
  .action(async ({ ctx: { user } }) => {
    const enabled = await isFeatureEnabled("assistant.ai_strategy");
    if (!enabled) {
      throw new ApplicationError("La stratégie IA est désactivée");
    }

    await checkAndIncrementAIQuota(user.id);

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalOpenMissions,
      overdueFollowUps,
      todayFollowUps,
      staleMissions,
      highScoreMissionCount,
      missionsWithoutRecentFollowUp,
      acceptedLast30Days,
      refusedLast30Days,
      propositionLast30Days,
      emailsSentLast7Days,
    ] = await Promise.all([
      prisma.mission.count({
        where: {
          userId: user.id,
          deletedAt: null,
          status: {
            in: ["A_POSTULER", "POSTULE", "ENTRETIEN", "PROPOSITION", "EN_PAUSE"],
          },
        },
      }),
      prisma.followUp.count({
        where: {
          userId: user.id,
          completedAt: null,
          scheduledAt: { lt: now },
        },
      }),
      prisma.followUp.count({
        where: {
          userId: user.id,
          completedAt: null,
          scheduledAt: {
            gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
            lte: new Date(
              now.getFullYear(),
              now.getMonth(),
              now.getDate(),
              23,
              59,
              59,
              999,
            ),
          },
        },
      }),
      prisma.mission.count({
        where: {
          userId: user.id,
          deletedAt: null,
          status: {
            in: ["A_POSTULER", "POSTULE", "ENTRETIEN", "PROPOSITION", "EN_PAUSE"],
          },
          updatedAt: { lt: fourteenDaysAgo },
        },
      }),
      prisma.mission.count({
        where: {
          userId: user.id,
          deletedAt: null,
          status: "A_POSTULER",
          score: { gte: 75 },
        },
      }),
      prisma.mission.count({
        where: {
          userId: user.id,
          deletedAt: null,
          status: {
            in: ["POSTULE", "ENTRETIEN", "PROPOSITION"],
          },
          followUps: {
            none: {
              scheduledAt: { gte: sevenDaysAgo },
            },
          },
        },
      }),
      prisma.mission.count({
        where: {
          userId: user.id,
          deletedAt: null,
          status: "ACCEPTE",
          updatedAt: { gte: thirtyDaysAgo },
        },
      }),
      prisma.mission.count({
        where: {
          userId: user.id,
          deletedAt: null,
          status: "REFUSE",
          updatedAt: { gte: thirtyDaysAgo },
        },
      }),
      prisma.mission.count({
        where: {
          userId: user.id,
          deletedAt: null,
          status: "PROPOSITION",
          updatedAt: { gte: thirtyDaysAgo },
        },
      }),
      prisma.sentEmail.count({
        where: {
          userId: user.id,
          isDraft: false,
          createdAt: { gte: sevenDaysAgo },
        },
      }),
    ]);

    const prompt = `
Tu es un coach commercial senior spécialisé freelances tech.

Contexte utilisateur:
- Missions ouvertes: ${totalOpenMissions}
- Relances en retard: ${overdueFollowUps}
- Relances prévues aujourd'hui: ${todayFollowUps}
- Missions stales (>14j): ${staleMissions}
- Missions à haut score (>=75): ${highScoreMissionCount}
- Missions sans relance récente: ${missionsWithoutRecentFollowUp}
- Missions acceptées (30j): ${acceptedLast30Days}
- Missions refusées (30j): ${refusedLast30Days}
- Missions en proposition (30j): ${propositionLast30Days}
- Emails envoyés (7j): ${emailsSentLast7Days}

Objectif:
- Générer un plan d'action concret pour les prochaines 24h.
- Donner des priorités actionnables (pas de théorie).
- Être spécifique, court et orienté exécution.
`.trim();

    const result = await generateObject({
      model: AI_MODELS.fast,
      schema: todayStrategyOutputSchema,
      prompt,
      temperature: 0.3,
    });

    return result.object;
  });

