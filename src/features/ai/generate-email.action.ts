"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { ApplicationError } from "@/lib/errors/application-error";
import { prisma } from "@/lib/prisma";
import { generateObject } from "ai";
import { z } from "zod";
import { AI_MODELS } from "./ai-config";
import { checkAndIncrementAIQuota } from "./ai-quota";
import {
  EMAIL_WRITER_SYSTEM_PROMPT,
  emailWriterOutputSchema,
} from "./prompts/email-writer.prompt";

const generateEmailInputSchema = z.object({
  missionId: z.string(),
  templateType: z.string().optional(),
});

export const generateEmailAction = authAction
  .inputSchema(generateEmailInputSchema)
  .action(
    async ({ parsedInput: { missionId, templateType }, ctx: { user } }) => {
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

      const prompt = buildPrompt(mission, profile, templateType);

      const result = await generateObject({
        model: AI_MODELS.fast,
        system: EMAIL_WRITER_SYSTEM_PROMPT,
        prompt,
        schema: emailWriterOutputSchema,
      });

      await prisma.aIUsage.create({
        data: {
          userId: user.id,
          feature: "EMAIL_WRITING",
          inputTokens: result.usage.inputTokens ?? 0,
          outputTokens: result.usage.outputTokens ?? 0,
        },
      });

      return result.object;
    },
  );

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
    skills: unknown;
    tjmTarget: number | null;
    zone: string | null;
  } | null,
  templateType?: string,
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
    const skills = Array.isArray(profile.skills)
      ? (profile.skills as { name: string }[]).map((s) => s.name).join(", ")
      : "";
    if (skills) prompt += `- Competences : ${skills}\n`;
    if (profile.zone) prompt += `- Zone : ${profile.zone}\n`;
  }

  if (templateType) {
    const typeLabels: Record<string, string> = {
      FIRST_CONTACT: "Premier contact / candidature spontanee",
      FOLLOW_UP_J3: "Relance 3 jours apres candidature",
      FOLLOW_UP_J7: "Relance 7 jours apres candidature",
      FOLLOW_UP_J14: "Relance 14 jours apres candidature",
      POST_INTERVIEW: "Email post-entretien / remerciement",
      NEGOTIATION: "Email de negociation",
      THANK_YOU: "Email de remerciement",
    };
    prompt += `\n## Type d'email\n`;
    prompt += `${typeLabels[templateType] ?? templateType}\n`;
  }

  prompt += `\nGenere un email adapte a cette mission et a mon profil.`;
  return prompt;
}
