"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { ApplicationError } from "@/lib/errors/application-error";
import { prisma } from "@/lib/prisma";
import { enforcePlanLimit } from "@/lib/plan-limits";
import { z } from "zod";
import {
  createTemplateSchema,
  templateTypeSchema,
  updateTemplateSchema,
} from "./templates.schema";

export const createTemplateAction = authAction
  .inputSchema(createTemplateSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    await enforcePlanLimit(user.id, "messageTemplates");

    const template = await prisma.messageTemplate.create({
      data: {
        ...parsedInput,
        userId: user.id,
        isSystem: false,
      },
    });

    return template;
  });

export const updateTemplateAction = authAction
  .inputSchema(updateTemplateSchema)
  .action(async ({ parsedInput: { id, ...data }, ctx: { user } }) => {
    const template = await prisma.messageTemplate.findFirst({
      where: { id },
    });

    if (!template) {
      throw new ApplicationError("Template introuvable");
    }

    if (template.isSystem) {
      throw new ApplicationError("Impossible de modifier un template systeme");
    }

    if (template.userId !== user.id) {
      throw new ApplicationError("Vous ne pouvez modifier que vos templates");
    }

    const updated = await prisma.messageTemplate.update({
      where: { id },
      data,
    });

    return updated;
  });

export const deleteTemplateAction = authAction
  .inputSchema(z.object({ id: z.string() }))
  .action(async ({ parsedInput: { id }, ctx: { user } }) => {
    const template = await prisma.messageTemplate.findFirst({
      where: { id },
    });

    if (!template) {
      throw new ApplicationError("Template introuvable");
    }

    if (template.isSystem) {
      throw new ApplicationError("Impossible de supprimer un template systeme");
    }

    if (template.userId !== user.id) {
      throw new ApplicationError("Vous ne pouvez supprimer que vos templates");
    }

    await prisma.messageTemplate.delete({
      where: { id },
    });

    return { deleted: true };
  });

export const getTemplatesAction = authAction
  .inputSchema(
    z.object({
      type: templateTypeSchema.optional(),
    }),
  )
  .action(async ({ parsedInput: { type }, ctx: { user } }) => {
    const where: Record<string, unknown> = {
      OR: [{ userId: user.id }, { isSystem: true }],
    };

    if (type) {
      where.type = type;
    }

    const templates = await prisma.messageTemplate.findMany({
      where,
      orderBy: [{ isSystem: "desc" }, { createdAt: "desc" }],
    });

    return templates;
  });

export const duplicateTemplateAction = authAction
  .inputSchema(z.object({ id: z.string() }))
  .action(async ({ parsedInput: { id }, ctx: { user } }) => {
    await enforcePlanLimit(user.id, "messageTemplates");

    const template = await prisma.messageTemplate.findFirst({
      where: { id, OR: [{ userId: user.id }, { isSystem: true }] },
    });

    if (!template) {
      throw new ApplicationError("Template introuvable");
    }

    return prisma.messageTemplate.create({
      data: {
        name: `Copie de ${template.name}`,
        subject: template.subject,
        body: template.body,
        type: template.type,
        variables: template.variables,
        userId: user.id,
        isSystem: false,
      },
    });
  });

export const getTemplateAction = authAction
  .inputSchema(z.object({ id: z.string() }))
  .action(async ({ parsedInput: { id }, ctx: { user } }) => {
    const template = await prisma.messageTemplate.findFirst({
      where: {
        id,
        OR: [{ userId: user.id }, { isSystem: true }],
      },
    });

    if (!template) {
      throw new ApplicationError("Template introuvable");
    }

    return template;
  });
