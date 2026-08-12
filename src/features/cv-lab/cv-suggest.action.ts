"use server";

import { generateObject } from "ai";
import { z } from "zod";
import { rateLimitedAuthAction } from "@/lib/actions/safe-actions";
import { AI_MODELS } from "@/features/ai/ai-config";
import { runTrackedAI } from "@/features/ai/ai-usage";

const suggestTechStackInputSchema = z.object({
  title: z.string().min(1).max(200),
  company: z.string().optional(),
  description: z.string().optional(),
});

const suggestTechStackOutputSchema = z.object({
  suggestions: z.array(z.string()).max(15),
});

export const suggestTechStackAction = rateLimitedAuthAction(
  "cv-suggest",
  15,
  60,
)
  .inputSchema(suggestTechStackInputSchema)
  .action(
    async ({ parsedInput: { title, company, description }, ctx: { user } }) => {
      const contextParts: string[] = [`Poste: ${title}`];
      if (company) contextParts.push(`Entreprise: ${company}`);
      if (description) contextParts.push(`Description: ${description}`);

      const result = await runTrackedAI(
        {
          userId: user.id,
          feature: "CV_SUGGEST",
          modelId: AI_MODELS.fast.modelId,
          context: { suggestion: "tech-stack" },
        },
        async () =>
          generateObject({
            model: AI_MODELS.fast,
            system:
              "Tu es un expert tech. Suggere les technologies et outils les plus probables pour ce poste. Retourne uniquement des noms de technologies concis (ex: React, Node.js, PostgreSQL). Ne repete pas les technologies deja presentes.",
            prompt: contextParts.join("\n"),
            schema: suggestTechStackOutputSchema,
            temperature: 0.3,
          }),
      );

      return result.object;
    },
  );

const suggestAchievementsInputSchema = z.object({
  title: z.string().min(1).max(200),
  company: z.string().optional(),
  description: z.string().optional(),
});

const suggestAchievementsOutputSchema = z.object({
  suggestions: z.array(z.string()).max(10),
});

export const suggestAchievementsAction = rateLimitedAuthAction(
  "cv-suggest",
  15,
  60,
)
  .inputSchema(suggestAchievementsInputSchema)
  .action(
    async ({ parsedInput: { title, company, description }, ctx: { user } }) => {
      const contextParts: string[] = [`Poste: ${title}`];
      if (company) contextParts.push(`Entreprise: ${company}`);
      if (description) contextParts.push(`Description: ${description}`);

      const result = await runTrackedAI(
        {
          userId: user.id,
          feature: "CV_SUGGEST",
          modelId: AI_MODELS.fast.modelId,
          context: { suggestion: "achievements" },
        },
        async () =>
          generateObject({
            model: AI_MODELS.fast,
            system:
              "Tu es un expert en redaction de CV. Suggere des realisations percutantes et quantifiees pour ce poste. Chaque realisation doit commencer par un verbe d'action et inclure un impact mesurable si possible. Formule en francais.",
            prompt: contextParts.join("\n"),
            schema: suggestAchievementsOutputSchema,
            temperature: 0.5,
          }),
      );

      return result.object;
    },
  );
