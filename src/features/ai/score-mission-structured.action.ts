"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { ApplicationError } from "@/lib/errors/application-error";
import { prisma } from "@/lib/prisma";
import { generateObject } from "ai";
import { z } from "zod";
import { AI_MODELS } from "./ai-config";
import { checkAndIncrementAIQuota } from "./ai-quota";
import {
  STRUCTURED_SCORING_SYSTEM_PROMPT,
  structuredScoringOutputSchema,
} from "./prompts/structured-scoring.prompt";

const scoreMissionStructuredInputSchema = z.object({
  missionId: z.string(),
});

export const scoreMissionStructuredAction = authAction
  .inputSchema(scoreMissionStructuredInputSchema)
  .action(async ({ parsedInput: { missionId }, ctx: { user } }) => {
    await checkAndIncrementAIQuota(user.id);

    const [mission, profile] = await Promise.all([
      prisma.mission.findFirst({
        where: { id: missionId, userId: user.id, deletedAt: null },
        include: { contact: true, platform: true },
      }),
      prisma.userProfile.findFirst({
        where: { userId: user.id, isDefault: true },
      }),
    ]);

    if (!mission) {
      throw new ApplicationError("Mission introuvable");
    }

    const prompt = buildPrompt(mission, profile);

    const result = await generateObject({
      model: AI_MODELS.fast,
      system: STRUCTURED_SCORING_SYSTEM_PROMPT,
      prompt,
      schema: structuredScoringOutputSchema,
    });

    await prisma.aIUsage.create({
      data: {
        userId: user.id,
        feature: "STRUCTURED_SCORING",
        inputTokens: result.usage.inputTokens ?? 0,
        outputTokens: result.usage.outputTokens ?? 0,
      },
    });

    return result.object;
  });

function buildPrompt(
  mission: {
    title: string;
    company: string | null;
    description: string | null;
    stack: string[];
    tjm: number | null;
    duration: string | null;
    workType: string | null;
    location: string | null;
  },
  profile: {
    headline: string | null;
    bio: string | null;
    skills: unknown;
    experiences: unknown;
    tjmTarget: number | null;
    workTypePreference: string | null;
    zone: string | null;
  } | null,
): string {
  let prompt = `## Mission a evaluer\n`;
  prompt += `- Titre : ${mission.title}\n`;
  if (mission.company) prompt += `- Entreprise : ${mission.company}\n`;
  if (mission.description) prompt += `- Description : ${mission.description}\n`;
  if (mission.stack.length > 0)
    prompt += `- Stack : ${mission.stack.join(", ")}\n`;
  if (mission.tjm) prompt += `- TJM : ${mission.tjm}€\n`;
  if (mission.duration) prompt += `- Duree : ${mission.duration}\n`;
  if (mission.workType) prompt += `- Mode : ${mission.workType}\n`;
  if (mission.location) prompt += `- Lieu : ${mission.location}\n`;

  if (profile) {
    prompt += `\n## Mon profil freelance\n`;
    if (profile.headline) prompt += `- Headline : ${profile.headline}\n`;
    if (profile.bio) prompt += `- Bio : ${profile.bio}\n`;
    const skills = Array.isArray(profile.skills)
      ? (profile.skills as { name: string }[]).map((s) => s.name).join(", ")
      : "";
    if (skills) prompt += `- Competences : ${skills}\n`;
    if (profile.tjmTarget) prompt += `- TJM cible : ${profile.tjmTarget}€\n`;
    if (profile.workTypePreference)
      prompt += `- Mode prefere : ${profile.workTypePreference}\n`;
    if (profile.zone) prompt += `- Zone : ${profile.zone}\n`;

    if (Array.isArray(profile.experiences) && profile.experiences.length > 0) {
      prompt += `- Experiences : ${(profile.experiences as { title: string; company?: string }[]).map((e) => `${e.title}${e.company ? ` chez ${e.company}` : ""}`).join(", ")}\n`;
    }
  }

  prompt += `\nAnalyse la compatibilite entre cette mission et mon profil. Fournis un scoring structure.`;
  return prompt;
}
