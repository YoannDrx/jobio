"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { ApplicationError } from "@/lib/errors/application-error";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const missionStatusSchema = z.enum([
  "A_POSTULER",
  "POSTULE",
  "ENTRETIEN",
  "PROPOSITION",
  "ACCEPTE",
  "REFUSE",
  "EN_PAUSE",
  "ABANDONNE",
  "ARCHIVE",
]);

const followUpTypeSchema = z.enum(["EMAIL", "CALL", "MESSAGE", "MEETING"]);

const createFollowUpRuleSchema = z.object({
  name: z.string().min(1, "Le nom est requis").max(100),
  missionStatus: missionStatusSchema,
  delayDays: z.number().min(0).max(365),
  followUpType: followUpTypeSchema,
  templateId: z.string().optional(),
  isActive: z.boolean().default(true),
});

const updateFollowUpRuleSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100).optional(),
  missionStatus: missionStatusSchema.optional(),
  delayDays: z.number().min(0).max(365).optional(),
  followUpType: followUpTypeSchema.optional(),
  templateId: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

export const getFollowUpRulesAction = authAction
  .inputSchema(z.object({}))
  .action(async ({ ctx: { user } }) => {
    const rules = await prisma.followUpRule.findMany({
      where: { userId: user.id },
      include: {
        template: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return rules;
  });

export const createFollowUpRuleAction = authAction
  .inputSchema(createFollowUpRuleSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    if (parsedInput.templateId) {
      const template = await prisma.messageTemplate.findFirst({
        where: { id: parsedInput.templateId, userId: user.id },
      });
      if (!template) {
        throw new ApplicationError("Template introuvable");
      }
    }

    const rule = await prisma.followUpRule.create({
      data: {
        ...parsedInput,
        userId: user.id,
      },
    });

    return rule;
  });

export const updateFollowUpRuleAction = authAction
  .inputSchema(updateFollowUpRuleSchema)
  .action(async ({ parsedInput: { id, ...data }, ctx: { user } }) => {
    const rule = await prisma.followUpRule.findFirst({
      where: { id, userId: user.id },
    });

    if (!rule) {
      throw new ApplicationError("Règle introuvable");
    }

    const updated = await prisma.followUpRule.update({
      where: { id },
      data,
    });

    return updated;
  });

export const deleteFollowUpRuleAction = authAction
  .inputSchema(z.object({ id: z.string() }))
  .action(async ({ parsedInput: { id }, ctx: { user } }) => {
    const rule = await prisma.followUpRule.findFirst({
      where: { id, userId: user.id },
    });

    if (!rule) {
      throw new ApplicationError("Règle introuvable");
    }

    await prisma.followUpRule.delete({
      where: { id },
    });

    return { deleted: true };
  });
