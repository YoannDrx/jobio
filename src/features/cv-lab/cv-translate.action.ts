"use server";

import { generateObject } from "ai";
import { z } from "zod";
import { rateLimitedAuthAction } from "@/lib/actions/safe-actions";
import { ApplicationError } from "@/lib/errors/application-error";
import { AI_MODELS } from "@/features/ai/ai-config";
import { checkAndIncrementAIQuota } from "@/features/ai/ai-quota";
import { prisma } from "@/lib/prisma";

const translateCvInputSchema = z.object({
  targetLanguage: z.enum(["en", "de", "es", "it", "pt", "nl"]),
  documentName: z.string().optional(),
});

const translateCvOutputSchema = z.object({
  translatedHeadline: z.string(),
  translatedSummary: z.string(),
  translatedName: z.string(),
  contentOverrides: z.record(
    z.string(),
    z.array(
      z.object({
        masterItemId: z.string(),
        description: z.string().optional(),
        title: z.string().optional(),
        company: z.string().optional(),
        name: z.string().optional(),
        institution: z.string().optional(),
        degree: z.string().optional(),
        field: z.string().optional(),
        issuer: z.string().optional(),
        location: z.string().optional(),
        role: z.string().optional(),
        level: z.string().optional(),
      }),
    ),
  ),
});

const LANGUAGE_LABELS: Record<string, string> = {
  en: "English",
  de: "Deutsch",
  es: "Español",
  it: "Italiano",
  pt: "Português",
  nl: "Nederlands",
};

export const translateCvAction = rateLimitedAuthAction("cv-translate", 5, 60)
  .inputSchema(translateCvInputSchema)
  .action(
    async ({
      parsedInput: { targetLanguage, documentName },
      ctx: { user },
    }) => {
      const masterCv = await prisma.masterCv.findFirst({
        where: { userId: user.id },
        select: {
          id: true,
          fullName: true,
          headline: true,
          summary: true,
          experiences: true,
          skills: true,
          education: true,
          projects: true,
          languages: true,
          certifications: true,
        },
      });

      if (!masterCv) {
        throw new ApplicationError(
          "Créez d'abord un CV Master avant de le traduire.",
        );
      }

      await checkAndIncrementAIQuota(user.id);

      const masterCvJson = JSON.stringify({
        fullName: masterCv.fullName,
        headline: masterCv.headline,
        summary: masterCv.summary,
        experiences: masterCv.experiences,
        skills: masterCv.skills,
        education: masterCv.education,
        projects: masterCv.projects,
        languages: masterCv.languages,
        certifications: masterCv.certifications,
      });

      const result = await generateObject({
        model: AI_MODELS.smart,
        system: `Tu es un expert en traduction professionnelle et en rédaction de CV. Tu traduis un CV du français vers ${LANGUAGE_LABELS[targetLanguage]}.

Règles:
- Traduis tous les textes vers ${LANGUAGE_LABELS[targetLanguage]}
- Garde les noms propres, les noms d'entreprises, les technologies et les noms de projets inchangés
- Adapte les conventions de formatage à la culture et la langue cible
- Maintiens le ton professionnel
- Pour contentOverrides, utilise les masterItemId exacts des items du CV Master
- Pour les sections: experiences, skills, education, projects, languages, certifications`,
        prompt: `## CV Master (JSON)\n${masterCvJson}\n\nTraduis ce CV en ${LANGUAGE_LABELS[targetLanguage]} et retourne la structure avec les traductions.`,
        schema: translateCvOutputSchema,
        temperature: 0.3,
      });

      await prisma.aIUsage.create({
        data: {
          userId: user.id,
          feature: "CV_TRANSLATE",
          inputTokens: result.usage.inputTokens ?? 0,
          outputTokens: result.usage.outputTokens ?? 0,
        },
      });

      return {
        ...result.object,
        documentName: documentName ?? `CV - ${LANGUAGE_LABELS[targetLanguage]}`,
      };
    },
  );
