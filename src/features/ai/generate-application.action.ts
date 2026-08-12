"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { ApplicationError } from "@/lib/errors/application-error";
import { prisma } from "@/lib/prisma";
import { generateObject } from "ai";
import { z } from "zod";
import { AI_MODELS } from "./ai-config";
import { runTrackedAI } from "./ai-usage";
import {
  APPLICATION_WRITER_SYSTEM_PROMPT,
  applicationWriterOutputSchema,
} from "./prompts/application-writer.prompt";

const generateApplicationInputSchema = z.object({
  missionId: z.string(),
});

export const generateApplicationAction = authAction
  .inputSchema(generateApplicationInputSchema)
  .action(async ({ parsedInput: { missionId }, ctx: { user } }) => {
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

    const result = await runTrackedAI(
      {
        userId: user.id,
        feature: "APPLICATION_MESSAGE",
        modelId: AI_MODELS.fast.modelId,
        context: { missionId },
      },
      async () =>
        generateObject({
          model: AI_MODELS.fast,
          system: APPLICATION_WRITER_SYSTEM_PROMPT,
          prompt,
          schema: applicationWriterOutputSchema,
        }),
    );

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
    contact: {
      firstName: string;
      lastName: string;
      role: string | null;
    } | null;
    platform: { name: string } | null;
  },
  profile: {
    headline: string | null;
    bio: string | null;
    skills: unknown;
    experiences: unknown;
    zone: string | null;
  } | null,
): string {
  let prompt = `## Mission\n`;
  prompt += `- Titre : ${mission.title}\n`;
  if (mission.company) prompt += `- Entreprise : ${mission.company}\n`;
  if (mission.description) prompt += `- Description : ${mission.description}\n`;
  if (mission.stack.length > 0)
    prompt += `- Stack : ${mission.stack.join(", ")}\n`;
  if (mission.duration) prompt += `- Duree : ${mission.duration}\n`;
  if (mission.workType) prompt += `- Mode : ${mission.workType}\n`;
  if (mission.location) prompt += `- Lieu : ${mission.location}\n`;
  if (mission.platform) prompt += `- Plateforme : ${mission.platform.name}\n`;

  if (mission.contact) {
    prompt += `\n## Contact\n`;
    prompt += `- Nom : ${mission.contact.firstName} ${mission.contact.lastName}\n`;
    if (mission.contact.role) prompt += `- Role : ${mission.contact.role}\n`;
  }

  if (profile) {
    prompt += `\n## Mon profil freelance\n`;
    if (profile.headline) prompt += `- Headline : ${profile.headline}\n`;
    if (profile.bio) prompt += `- Bio : ${profile.bio}\n`;
    const skills = Array.isArray(profile.skills)
      ? (profile.skills as { name: string }[]).map((s) => s.name).join(", ")
      : "";
    if (skills) prompt += `- Competences : ${skills}\n`;
    if (profile.zone) prompt += `- Zone : ${profile.zone}\n`;

    if (Array.isArray(profile.experiences) && profile.experiences.length > 0) {
      prompt += `- Experiences cles : ${(
        profile.experiences as { title: string; company?: string }[]
      )
        .slice(0, 3)
        .map((e) => `${e.title}${e.company ? ` chez ${e.company}` : ""}`)
        .join(", ")}\n`;
    }
  }

  prompt += `\nGenere un message de candidature adapte a cette mission, mon profil et la plateforme.`;
  return prompt;
}
