"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { ApplicationError } from "@/lib/errors/application-error";
import { prisma } from "@/lib/prisma";
import { generateText } from "ai";
import { z } from "zod";
import { AI_MODELS } from "./ai-config";
import { runTrackedAI } from "./ai-usage";

const generateNegotiationScriptInputSchema = z.object({
  missionId: z.string(),
});

export const generateNegotiationScriptAction = authAction
  .inputSchema(generateNegotiationScriptInputSchema)
  .action(async ({ parsedInput: { missionId }, ctx: { user } }) => {
    const mission = await prisma.mission.findFirst({
      where: { id: missionId, userId: user.id, deletedAt: null },
    });

    if (!mission) {
      throw new ApplicationError("Mission introuvable");
    }

    if (!mission.tjm) {
      throw new ApplicationError("Cette mission n'a pas de TJM défini");
    }

    // Récupérer toutes les missions avec un TJM pour calculer la moyenne
    const otherMissions = await prisma.mission.findMany({
      where: { userId: user.id, deletedAt: null, tjm: { not: null } },
      select: { tjm: true },
    });

    const avgTjm =
      otherMissions.length > 0
        ? Math.round(
            otherMissions.reduce((sum, m) => sum + (m.tjm ?? 0), 0) /
              otherMissions.length,
          )
        : null;

    const prompt = `Tu es un expert en négociation de TJM pour les freelances tech.
Mission : "${mission.title}" chez ${mission.company ?? "une entreprise"}.
TJM proposé : ${mission.tjm}€/j
${avgTjm ? `TJM moyen de mon pipeline : ${avgTjm}€/j` : ""}

Génère un script de négociation court (5-8 phrases) pour obtenir un TJM plus élevé. Inclus :
1. Comment valoriser son expertise
2. Une argumentation basée sur la valeur apportée
3. Une contre-proposition concrète si le TJM est en dessous du marché
4. Une phrase de clôture positive

Réponds en français, format professionnel mais direct.`;

    const { text } = await runTrackedAI(
      {
        userId: user.id,
        feature: "OFFER_SCORING",
        modelId: AI_MODELS.fast.modelId,
        context: { surface: "negotiation" },
      },
      async () => generateText({ model: AI_MODELS.fast, prompt }),
    );

    return { script: text, tjm: mission.tjm, avgTjm };
  });
