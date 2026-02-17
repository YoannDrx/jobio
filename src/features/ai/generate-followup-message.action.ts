"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { ApplicationError } from "@/lib/errors/application-error";
import { prisma } from "@/lib/prisma";
import { generateObject } from "ai";
import { z } from "zod";
import { AI_MODELS } from "./ai-config";
import { checkAndIncrementAIQuota } from "./ai-quota";
import {
  FOLLOWUP_WRITER_SYSTEM_PROMPT,
  followupWriterOutputSchema,
} from "./prompts/followup-writer.prompt";

const generateFollowupMessageInputSchema = z.object({
  missionId: z.string(),
  followUpType: z.string().optional(),
});

export const generateFollowupMessageAction = authAction
  .inputSchema(generateFollowupMessageInputSchema)
  .action(
    async ({ parsedInput: { missionId, followUpType }, ctx: { user } }) => {
      await checkAndIncrementAIQuota(user.id);

      const [mission, profile, followUps] = await Promise.all([
        prisma.mission.findFirst({
          where: { id: missionId, userId: user.id, deletedAt: null },
          include: { contact: true, platform: true },
        }),
        prisma.userProfile.findFirst({
          where: { userId: user.id, isDefault: true },
        }),
        prisma.followUp.findMany({
          where: { missionId, userId: user.id },
          orderBy: { scheduledAt: "desc" },
          take: 5,
        }),
      ]);

      if (!mission) {
        throw new ApplicationError("Mission introuvable");
      }

      const prompt = buildPrompt(mission, profile, followUps, followUpType);

      const result = await generateObject({
        model: AI_MODELS.fast,
        system: FOLLOWUP_WRITER_SYSTEM_PROMPT,
        prompt,
        schema: followupWriterOutputSchema,
      });

      await prisma.aIUsage.create({
        data: {
          userId: user.id,
          feature: "FOLLOW_UP_MESSAGE",
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
    status: string;
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
    zone: string | null;
  } | null,
  followUps: {
    type: string;
    title: string;
    description: string | null;
    scheduledAt: Date;
    completedAt: Date | null;
  }[],
  followUpType?: string,
): string {
  let prompt = `## Mission\n`;
  prompt += `- Titre : ${mission.title}\n`;
  if (mission.company) prompt += `- Entreprise : ${mission.company}\n`;
  if (mission.description) prompt += `- Description : ${mission.description}\n`;
  if (mission.stack.length > 0)
    prompt += `- Stack : ${mission.stack.join(", ")}\n`;
  prompt += `- Statut actuel : ${mission.status}\n`;
  if (mission.platform) prompt += `- Plateforme : ${mission.platform.name}\n`;

  if (mission.contact) {
    prompt += `\n## Contact\n`;
    prompt += `- Nom : ${mission.contact.firstName} ${mission.contact.lastName}\n`;
    if (mission.contact.role) prompt += `- Role : ${mission.contact.role}\n`;
  }

  if (profile) {
    prompt += `\n## Mon profil\n`;
    if (profile.headline) prompt += `- Headline : ${profile.headline}\n`;
    const skills = Array.isArray(profile.skills)
      ? (profile.skills as { name: string }[]).map((s) => s.name).join(", ")
      : "";
    if (skills) prompt += `- Competences : ${skills}\n`;
  }

  if (followUps.length > 0) {
    prompt += `\n## Historique des relances (${followUps.length} relance(s))\n`;
    for (const fu of followUps) {
      const status = fu.completedAt ? "completee" : "en attente";
      prompt += `- ${fu.title} (${fu.type}, ${status}, prevue le ${fu.scheduledAt.toLocaleDateString("fr-FR")})\n`;
      if (fu.description) prompt += `  Detail : ${fu.description}\n`;
    }
  } else {
    prompt += `\n## Historique\nAucune relance precedente. C'est la premiere relance.\n`;
  }

  if (followUpType) {
    const typeLabels: Record<string, string> = {
      EMAIL: "Relance par email",
      CALL: "Relance par telephone",
      MESSAGE: "Relance par message",
      MEETING: "Suite a une reunion",
    };
    prompt += `\n## Type de relance\n${typeLabels[followUpType] ?? followUpType}\n`;
  }

  prompt += `\nGenere un message de relance adapte au contexte et a l'historique.`;
  return prompt;
}
