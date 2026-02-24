"use server";

import { generateObject } from "ai";
import { z } from "zod";
import { rateLimitedAuthAction } from "@/lib/actions/safe-actions";
import { ApplicationError } from "@/lib/errors/application-error";
import { AI_MODELS } from "@/features/ai/ai-config";
import { checkAndIncrementAIQuota } from "@/features/ai/ai-quota";
import { prisma } from "@/lib/prisma";

const generateFromOfferInputSchema = z.object({
  jobDescription: z.string().trim().min(20).max(15000),
});

const generateFromOfferOutputSchema = z.object({
  targetRole: z.string(),
  headlineOverride: z.string(),
  summaryOverride: z.string(),
  hiddenItems: z.record(z.string(), z.array(z.string())),
  contentOverrides: z.record(
    z.string(),
    z.array(
      z.object({
        masterItemId: z.string(),
        description: z.string().optional(),
        title: z.string().optional(),
      }),
    ),
  ),
});

export const generateCvFromOfferAction = rateLimitedAuthAction(
  "cv-generate",
  5,
  60,
)
  .inputSchema(generateFromOfferInputSchema)
  .action(async ({ parsedInput: { jobDescription }, ctx: { user } }) => {
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
        "Creez d'abord un CV Master avant de generer un CV.",
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
      system: `Tu es un expert en recrutement et redaction de CV. Tu analyses une offre d'emploi et un CV Master pour generer un CV optimise.

Regles:
- Masque (hiddenItems) les items non pertinents pour le poste
- Garde les items les plus pertinents et adapte leurs descriptions (contentOverrides)
- Genere un headlineOverride et summaryOverride adaptes au poste
- Les descriptions doivent etre percutantes, avec des verbes d'action et des resultats mesurables
- Reponds en francais
- Pour contentOverrides, utilise les masterItemId exacts des items du CV Master
- Pour hiddenItems, utilise les sections: experiences, skills, education, projects, languages, certifications`,
      prompt: `## CV Master (JSON)\n${masterCvJson}\n\n## Offre d'emploi\n${jobDescription}`,
      schema: generateFromOfferOutputSchema,
      temperature: 0.4,
    });

    await prisma.aIUsage.create({
      data: {
        userId: user.id,
        feature: "CV_GENERATE_FROM_OFFER",
        inputTokens: result.usage.inputTokens ?? 0,
        outputTokens: result.usage.outputTokens ?? 0,
      },
    });

    return result.object;
  });
