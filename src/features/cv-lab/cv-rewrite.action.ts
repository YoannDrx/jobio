"use server";

import { generateObject } from "ai";
import { z } from "zod";
import { rateLimitedAuthAction } from "@/lib/actions/safe-actions";
import { AI_MODELS } from "@/features/ai/ai-config";
import { runTrackedAI } from "@/features/ai/ai-usage";

const rewriteInputSchema = z.object({
  text: z.string().trim().min(1).max(5000),
  mode: z.enum(["improve", "shorten", "adapt", "correct"]),
  context: z
    .object({
      jobTitle: z.string().optional(),
      company: z.string().optional(),
      targetRole: z.string().optional(),
    })
    .optional(),
});

const rewriteOutputSchema = z.object({
  rewritten: z.string(),
});

const MODE_PROMPTS: Record<string, string> = {
  improve:
    "Ameliore ce texte de CV pour le rendre plus percutant, professionnel et axe sur les resultats. Utilise des verbes d'action.",
  shorten:
    "Raccourcis ce texte de CV tout en gardant les informations essentielles. Vise 50-70% de la longueur originale.",
  adapt:
    "Adapte ce texte de CV pour mieux correspondre au poste cible. Mets en avant les competences pertinentes.",
  correct:
    "Corrige la grammaire, l'orthographe et ameliore la formulation de ce texte de CV. Garde le meme sens.",
};

export const rewriteCvFieldAction = rateLimitedAuthAction("cv-rewrite", 15, 60)
  .inputSchema(rewriteInputSchema)
  .action(async ({ parsedInput: { text, mode, context }, ctx: { user } }) => {
    const contextParts: string[] = [];
    if (context?.jobTitle)
      contextParts.push(`Poste actuel: ${context.jobTitle}`);
    if (context?.company) contextParts.push(`Entreprise: ${context.company}`);
    if (context?.targetRole)
      contextParts.push(`Poste cible: ${context.targetRole}`);

    const result = await runTrackedAI(
      {
        userId: user.id,
        feature: "CV_REWRITE",
        modelId: AI_MODELS.fast.modelId,
        context: { mode },
      },
      async () =>
        generateObject({
          model: AI_MODELS.fast,
          system:
            "Tu es un expert en redaction de CV. Tu reponds en francais. Tu ne changes pas la langue du texte original.",
          prompt: `${MODE_PROMPTS[mode]}\n\n${contextParts.length > 0 ? `Contexte:\n${contextParts.join("\n")}\n\n` : ""}Texte original:\n${text}`,
          schema: rewriteOutputSchema,
          temperature: 0.4,
        }),
    );

    return result.object;
  });
