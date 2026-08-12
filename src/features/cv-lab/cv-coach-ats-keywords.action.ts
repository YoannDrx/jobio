"use server";

import { generateObject } from "ai";
import { authAction } from "@/lib/actions/safe-actions";
import { ApplicationError } from "@/lib/errors/application-error";
import { prisma } from "@/lib/prisma";
import { runTrackedAI } from "@/features/ai/ai-usage";
import { AI_MODELS } from "@/features/ai/ai-config";
import { parseSnapshot } from "./cv-coach.utils";
import { z } from "zod";

const atsKeywordsInputSchema = z.object({
  sessionId: z.string().min(1),
  jobDescription: z.string().trim().min(20).max(10000),
});

const atsKeywordsOutputSchema = z.object({
  matched: z
    .array(
      z.object({
        keyword: z.string(),
        context: z.string(),
      }),
    )
    .max(30),
  missing: z
    .array(
      z.object({
        keyword: z.string(),
        suggestion: z.string(),
      }),
    )
    .max(30),
  score: z.number().int().min(0).max(100),
});

export type AtsKeywordsOutput = z.infer<typeof atsKeywordsOutputSchema>;

export const analyzeCvCoachAtsKeywordsAction = authAction
  .inputSchema(atsKeywordsInputSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    const session = await prisma.cvLabCoachSession.findFirst({
      where: {
        id: parsedInput.sessionId,
        userId: user.id,
      },
    });

    if (!session) {
      throw new ApplicationError("Session CV Coach introuvable");
    }

    const snapshot = parseSnapshot(session.structuredSnapshot);

    const result = await runTrackedAI(
      {
        userId: user.id,
        feature: "CV_COACH",
        modelId: AI_MODELS.fast.modelId,
        context: { sessionId: session.id, surface: "ats-keywords" },
      },
      async () =>
        generateObject({
          model: AI_MODELS.fast,
          system:
            "Tu es un expert ATS (Applicant Tracking System). Analyse la correspondance entre le CV et la fiche de poste. Identifie les mots-clés présents (matched) et manquants (missing) avec des suggestions d'ajout concrètes. Calcule un score ATS de 0 à 100.",
          prompt: `## CV (format JSON)\n${JSON.stringify(snapshot)}\n\n## Fiche de poste\n${parsedInput.jobDescription}`,
          schema: atsKeywordsOutputSchema,
          temperature: 0.3,
        }),
    );

    return result.object;
  });
