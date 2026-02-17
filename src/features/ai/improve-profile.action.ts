"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { ApplicationError } from "@/lib/errors/application-error";
import { prisma } from "@/lib/prisma";
import { generateObject } from "ai";
import { z } from "zod";
import { AI_MODELS } from "./ai-config";
import { checkAndIncrementAIQuota } from "./ai-quota";
import {
  PROFILE_IMPROVER_SYSTEM_PROMPT,
  profileImproverOutputSchema,
} from "./prompts/profile-improver.prompt";

const improveProfileInputSchema = z.object({
  profileId: z.string().optional(),
});

export const improveProfileAction = authAction
  .inputSchema(improveProfileInputSchema)
  .action(async ({ parsedInput: { profileId }, ctx: { user } }) => {
    await checkAndIncrementAIQuota(user.id);

    const profile = await prisma.userProfile.findFirst({
      where: profileId
        ? { id: profileId, userId: user.id }
        : { userId: user.id, isDefault: true },
    });

    if (!profile) {
      throw new ApplicationError("Profil introuvable");
    }

    const prompt = buildPrompt(profile);

    const result = await generateObject({
      model: AI_MODELS.fast,
      system: PROFILE_IMPROVER_SYSTEM_PROMPT,
      prompt,
      schema: profileImproverOutputSchema,
    });

    await prisma.aIUsage.create({
      data: {
        userId: user.id,
        feature: "PROFILE_IMPROVEMENT",
        inputTokens: result.usage.inputTokens ?? 0,
        outputTokens: result.usage.outputTokens ?? 0,
      },
    });

    return result.object;
  });

function buildPrompt(profile: {
  name: string;
  headline: string;
  bio: string | null;
  skills: unknown;
  experiences: unknown;
  education: unknown;
  certifications: unknown;
  languages: unknown;
  tjmTarget: number | null;
  workTypePreference: string | null;
  zone: string | null;
}): string {
  let prompt = `## Profil a analyser\n`;
  prompt += `- Nom : ${profile.name}\n`;
  prompt += `- Headline : ${profile.headline}\n`;
  if (profile.bio) prompt += `- Bio : ${profile.bio}\n`;

  const skills = Array.isArray(profile.skills)
    ? (profile.skills as { name: string }[]).map((s) => s.name).join(", ")
    : "";
  if (skills) prompt += `- Competences : ${skills}\n`;

  if (profile.tjmTarget) prompt += `- TJM cible : ${profile.tjmTarget}€\n`;
  if (profile.workTypePreference)
    prompt += `- Mode de travail : ${profile.workTypePreference}\n`;
  if (profile.zone) prompt += `- Zone : ${profile.zone}\n`;

  if (Array.isArray(profile.experiences) && profile.experiences.length > 0) {
    prompt += `\n## Experiences\n`;
    for (const exp of profile.experiences as {
      title: string;
      company?: string;
      description?: string;
    }[]) {
      prompt += `- ${exp.title}${exp.company ? ` chez ${exp.company}` : ""}`;
      if (exp.description) prompt += ` : ${exp.description}`;
      prompt += `\n`;
    }
  }

  if (Array.isArray(profile.education) && profile.education.length > 0) {
    prompt += `\n## Formation\n`;
    for (const edu of profile.education as {
      degree: string;
      school?: string;
    }[]) {
      prompt += `- ${edu.degree}${edu.school ? ` - ${edu.school}` : ""}\n`;
    }
  }

  if (
    Array.isArray(profile.certifications) &&
    profile.certifications.length > 0
  ) {
    prompt += `\n## Certifications\n`;
    for (const cert of profile.certifications as { name: string }[]) {
      prompt += `- ${cert.name}\n`;
    }
  }

  if (Array.isArray(profile.languages) && profile.languages.length > 0) {
    prompt += `\n## Langues\n`;
    for (const lang of profile.languages as {
      name: string;
      level?: string;
    }[]) {
      prompt += `- ${lang.name}${lang.level ? ` (${lang.level})` : ""}\n`;
    }
  }

  prompt += `\nAnalyse ce profil et propose des ameliorations concretes pour le rendre plus attractif sur le marche freelance.`;
  return prompt;
}
