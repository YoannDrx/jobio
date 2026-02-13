"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { prisma } from "@/lib/prisma";
import { generateObject } from "ai";
import { z } from "zod";
import { AI_MODELS } from "./ai-config";
import { checkAndIncrementAIQuota } from "./ai-quota";
import {
  LINKEDIN_POST_SYSTEM_PROMPT,
  linkedinPostOutputSchema,
} from "./prompts/linkedin-post.prompt";

const generateLinkedinPostInputSchema = z.object({
  topic: z.string(),
  tone: z.enum(["professional", "casual", "expert"]),
});

export const generateLinkedinPostAction = authAction
  .inputSchema(generateLinkedinPostInputSchema)
  .action(async ({ parsedInput: { topic, tone }, ctx: { user } }) => {
    await checkAndIncrementAIQuota(user.id);

    const profile = await prisma.userProfile.findFirst({
      where: { userId: user.id, isDefault: true },
    });

    const prompt = buildPrompt(topic, tone, profile);

    const result = await generateObject({
      model: AI_MODELS.fast,
      system: LINKEDIN_POST_SYSTEM_PROMPT,
      prompt,
      schema: linkedinPostOutputSchema,
    });

    await prisma.aIUsage.create({
      data: {
        userId: user.id,
        feature: "LINKEDIN_POST",
        inputTokens: result.usage.inputTokens ?? 0,
        outputTokens: result.usage.outputTokens ?? 0,
      },
    });

    return result.object;
  });

function buildPrompt(
  topic: string,
  tone: "professional" | "casual" | "expert",
  profile: {
    headline: string | null;
    bio: string | null;
    skills: unknown;
    zone: string | null;
  } | null,
): string {
  const toneLabels = {
    professional: "Professionnel et structure",
    casual: "Decontracte et accessible",
    expert: "Expert et technique",
  };

  let prompt = `## Sujet du post\n${topic}\n`;
  prompt += `\n## Ton souhaite\n${toneLabels[tone]}\n`;

  if (profile) {
    prompt += `\n## Mon profil freelance\n`;
    if (profile.headline) prompt += `- Headline : ${profile.headline}\n`;
    if (profile.bio) prompt += `- Bio : ${profile.bio}\n`;
    const skills = Array.isArray(profile.skills)
      ? (profile.skills as { name: string }[]).map((s) => s.name).join(", ")
      : "";
    if (skills) prompt += `- Competences : ${skills}\n`;
    if (profile.zone) prompt += `- Zone : ${profile.zone}\n`;
  }

  prompt += `\nGenere un post LinkedIn engageant sur ce sujet, adapte a mon profil et au ton demande.`;
  return prompt;
}
