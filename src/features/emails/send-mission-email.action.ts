"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { ApplicationError } from "@/lib/errors/application-error";
import { sendEmail } from "@/lib/mail/send-email";
import { prisma } from "@/lib/prisma";
import MarkdownEmail from "@email/markdown.email";
import { z } from "zod";

const sendMissionEmailSchema = z.object({
  missionId: z.string(),
  contactId: z.string().optional(),
  templateId: z.string().optional(),
  to: z.string().email("Adresse email invalide"),
  subject: z.string().min(1, "Le sujet est requis"),
  body: z.string().min(1, "Le contenu est requis"),
});

export const sendMissionEmailAction = authAction
  .inputSchema(sendMissionEmailSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    const mission = await prisma.mission.findFirst({
      where: { id: parsedInput.missionId, userId: user.id, deletedAt: null },
    });

    if (!mission) {
      throw new ApplicationError("Mission introuvable");
    }

    const emailResult = await sendEmail({
      to: parsedInput.to,
      subject: parsedInput.subject,
      html: MarkdownEmail({
        markdown: parsedInput.body,
        disabledSignature: true,
      }),
    });

    const sentEmail = await prisma.sentEmail.create({
      data: {
        userId: user.id,
        missionId: parsedInput.missionId,
        contactId: parsedInput.contactId ?? null,
        templateId: parsedInput.templateId ?? null,
        to: parsedInput.to,
        subject: parsedInput.subject,
        body: parsedInput.body,
        status: "sent",
        resendId: emailResult.data?.id ?? null,
      },
    });

    await prisma.activityEvent.create({
      data: {
        missionId: parsedInput.missionId,
        userId: user.id,
        type: "EMAIL_SENT",
        description: `Email envoyé à ${parsedInput.to} : "${parsedInput.subject}"`,
      },
    });

    return sentEmail;
  });

export const getSentEmailsAction = authAction
  .inputSchema(z.object({ missionId: z.string() }))
  .action(async ({ parsedInput: { missionId }, ctx: { user } }) => {
    return prisma.sentEmail.findMany({
      where: { missionId, userId: user.id },
      orderBy: { createdAt: "desc" },
      include: { template: { select: { name: true } } },
    });
  });

const saveDraftSchema = z.object({
  missionId: z.string(),
  contactId: z.string().optional(),
  templateId: z.string().optional(),
  to: z.string().email("Adresse email invalide"),
  subject: z.string().min(1, "Le sujet est requis"),
  body: z.string().min(1, "Le contenu est requis"),
});

export const saveDraftAction = authAction
  .inputSchema(saveDraftSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    const mission = await prisma.mission.findFirst({
      where: { id: parsedInput.missionId, userId: user.id, deletedAt: null },
    });

    if (!mission) {
      throw new ApplicationError("Mission introuvable");
    }

    const draft = await prisma.sentEmail.create({
      data: {
        userId: user.id,
        missionId: parsedInput.missionId,
        contactId: parsedInput.contactId ?? null,
        templateId: parsedInput.templateId ?? null,
        to: parsedInput.to,
        subject: parsedInput.subject,
        body: parsedInput.body,
        status: "draft",
        isDraft: true,
        sentAt: null,
      },
    });

    return draft;
  });

const updateDraftSchema = z.object({
  id: z.string(),
  to: z.string().email("Adresse email invalide").optional(),
  subject: z.string().min(1).optional(),
  body: z.string().min(1).optional(),
});

export const updateDraftAction = authAction
  .inputSchema(updateDraftSchema)
  .action(async ({ parsedInput: { id, ...data }, ctx: { user } }) => {
    const draft = await prisma.sentEmail.findFirst({
      where: { id, userId: user.id, isDraft: true },
    });

    if (!draft) {
      throw new ApplicationError("Brouillon introuvable");
    }

    return prisma.sentEmail.update({
      where: { id },
      data,
    });
  });

export const sendDraftAction = authAction
  .inputSchema(z.object({ id: z.string() }))
  .action(async ({ parsedInput: { id }, ctx: { user } }) => {
    const draft = await prisma.sentEmail.findFirst({
      where: { id, userId: user.id, isDraft: true },
    });

    if (!draft) {
      throw new ApplicationError("Brouillon introuvable");
    }

    const emailResult = await sendEmail({
      to: draft.to,
      subject: draft.subject,
      html: MarkdownEmail({
        markdown: draft.body,
        disabledSignature: true,
      }),
    });

    const sentEmail = await prisma.sentEmail.update({
      where: { id },
      data: {
        isDraft: false,
        status: "sent",
        sentAt: new Date(),
        resendId: emailResult.data?.id ?? null,
      },
    });

    if (draft.missionId) {
      await prisma.activityEvent.create({
        data: {
          missionId: draft.missionId,
          userId: user.id,
          type: "EMAIL_SENT",
          description: `Email envoyé à ${draft.to} : "${draft.subject}"`,
        },
      });
    }

    return sentEmail;
  });

export const getDraftsAction = authAction
  .inputSchema(z.object({ missionId: z.string() }))
  .action(async ({ parsedInput: { missionId }, ctx: { user } }) => {
    return prisma.sentEmail.findMany({
      where: { missionId, userId: user.id, isDraft: true },
      orderBy: { createdAt: "desc" },
      include: { template: { select: { name: true } } },
    });
  });

export const deleteDraftAction = authAction
  .inputSchema(z.object({ id: z.string() }))
  .action(async ({ parsedInput: { id }, ctx: { user } }) => {
    const draft = await prisma.sentEmail.findFirst({
      where: { id, userId: user.id, isDraft: true },
    });

    if (!draft) {
      throw new ApplicationError("Brouillon introuvable");
    }

    await prisma.sentEmail.delete({ where: { id } });

    return { success: true };
  });
