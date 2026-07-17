"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { ApplicationError } from "@/lib/errors/application-error";
import { sendEmail } from "@/lib/mail/send-email";
import { prisma } from "@/lib/prisma";
import MarkdownEmail from "@email/markdown.email";
import { z } from "zod";
import {
  evaluateOutreachWindow,
  isAcceptedEmailStatus,
  OUTREACH_WINDOW_MESSAGES,
  sanitizeProviderFailure,
} from "./outreach-policy";
import {
  evaluateFollowUpPolicy,
  FOLLOW_UP_POLICY_MESSAGES,
} from "@/features/follow-ups/follow-up-policy";

const timeZoneSchema = z.string().min(1).max(100);
const acceptedEmailStatuses = ["sent", "delivered", "opened", "clicked"];

const sendMissionEmailSchema = z.object({
  missionId: z.string(),
  templateId: z.string().optional(),
  operationId: z.string().uuid(),
  timeZone: timeZoneSchema,
  to: z.string().email("Adresse email invalide"),
  subject: z.string().min(1, "Le sujet est requis"),
  body: z.string().min(1, "Le contenu est requis"),
});

const assertOutreachAllowed = async (params: {
  userId: string;
  missionId: string;
  recipient: string;
  timeZone: string;
}) => {
  const windowReason = evaluateOutreachWindow(new Date(), params.timeZone);
  if (windowReason) {
    throw new ApplicationError(OUTREACH_WINDOW_MESSAGES[windowReason]);
  }

  const mission = await prisma.mission.findFirst({
    where: { id: params.missionId, userId: params.userId, deletedAt: null },
    include: {
      contact: { select: { id: true, tags: true, deletedAt: true } },
    },
  });

  if (!mission) throw new ApplicationError("Mission introuvable");

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentAcceptedEmails = await prisma.sentEmail.count({
    where: {
      userId: params.userId,
      isDraft: false,
      status: { in: acceptedEmailStatuses },
      sentAt: { gte: sevenDaysAgo },
      ...(mission.contactId
        ? { OR: [{ contactId: mission.contactId }, { to: params.recipient }] }
        : { to: params.recipient }),
    },
  });

  const reason = evaluateFollowUpPolicy({
    missionStatus: mission.status,
    isAutomated: false,
    contactTags: mission.contact
      ? mission.contact.deletedAt === null
        ? mission.contact.tags
        : ["do-not-contact"]
      : [],
    pendingNearTarget: 0,
    recentContactTouches: recentAcceptedEmails,
  });

  if (reason) throw new ApplicationError(FOLLOW_UP_POLICY_MESSAGES[reason]);
  return mission;
};

const assertTemplateAllowed = async (params: {
  templateId?: string;
  userId: string;
}) => {
  if (!params.templateId) return;
  const template = await prisma.messageTemplate.findFirst({
    where: {
      id: params.templateId,
      OR: [{ userId: params.userId }, { isSystem: true }],
    },
    select: { id: true },
  });
  if (!template) throw new ApplicationError("Template introuvable");
};

export const sendMissionEmailAction = authAction
  .inputSchema(sendMissionEmailSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    const mission = await assertOutreachAllowed({
      userId: user.id,
      missionId: parsedInput.missionId,
      recipient: parsedInput.to,
      timeZone: parsedInput.timeZone,
    });
    await assertTemplateAllowed({
      templateId: parsedInput.templateId,
      userId: user.id,
    });

    const attempt = await prisma.sentEmail.upsert({
      where: { providerRequestId: parsedInput.operationId },
      update: {},
      create: {
        userId: user.id,
        missionId: mission.id,
        contactId: mission.contactId,
        templateId: parsedInput.templateId ?? null,
        to: parsedInput.to,
        subject: parsedInput.subject,
        body: parsedInput.body,
        status: "pending",
        isDraft: false,
        providerRequestId: parsedInput.operationId,
      },
    });

    if (attempt.userId !== user.id || attempt.missionId !== mission.id) {
      throw new ApplicationError("Tentative d’envoi introuvable");
    }
    if (isAcceptedEmailStatus(attempt.status)) return attempt;

    await prisma.sentEmail.update({
      where: { id: attempt.id },
      data: {
        status: "sending",
        failureReason: null,
        lastAttemptAt: new Date(),
      },
    });

    const emailResult = await sendEmail(
      {
        to: attempt.to,
        subject: attempt.subject,
        html: MarkdownEmail({
          markdown: attempt.body,
          disabledSignature: true,
        }),
      },
      {
        idempotencyKey: `jobio-mission-${attempt.providerRequestId}`,
      },
    );

    if (emailResult.error) {
      await prisma.sentEmail.update({
        where: { id: attempt.id },
        data: {
          status: "failed",
          failureReason: sanitizeProviderFailure(emailResult.error.message),
        },
      });
      throw new ApplicationError(
        "L’email n’a pas été accepté par le fournisseur. Le message est conservé dans l’historique et peut être renvoyé.",
      );
    }

    const sentEmail = await prisma.$transaction(async (tx) => {
      const sentAt = new Date();
      const updated = await tx.sentEmail.update({
        where: { id: attempt.id },
        data: {
          status: "sent",
          sentAt,
          resendId: emailResult.data.id,
          failureReason: null,
        },
      });

      await tx.activityEvent.create({
        data: {
          missionId: mission.id,
          userId: user.id,
          type: "EMAIL_SENT",
          description: `Email envoyé à ${attempt.to} : "${attempt.subject}"`,
        },
      });

      if (attempt.templateId) {
        await tx.messageTemplateUsage.create({
          data: {
            templateId: attempt.templateId,
            userId: user.id,
            missionId: mission.id,
            channel: "email",
            source: "send_mission_email",
          },
        });
      }

      return updated;
    });

    return sentEmail;
  });

export const getSentEmailsAction = authAction
  .inputSchema(z.object({ missionId: z.string() }))
  .action(async ({ parsedInput: { missionId }, ctx: { user } }) => {
    return prisma.sentEmail.findMany({
      where: { missionId, userId: user.id, isDraft: false },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        to: true,
        subject: true,
        status: true,
        failureReason: true,
        isDraft: true,
        createdAt: true,
        sentAt: true,
        template: { select: { name: true } },
      },
    });
  });

const saveDraftSchema = z.object({
  missionId: z.string(),
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
    await assertTemplateAllowed({
      templateId: parsedInput.templateId,
      userId: user.id,
    });

    const draft = await prisma.sentEmail.create({
      data: {
        userId: user.id,
        missionId: parsedInput.missionId,
        contactId: mission.contactId,
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
  templateId: z.string().nullable().optional(),
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
    await assertTemplateAllowed({
      templateId: data.templateId ?? undefined,
      userId: user.id,
    });

    return prisma.sentEmail.update({
      where: { id },
      data: { ...data, status: "draft", failureReason: null },
    });
  });

export const sendDraftAction = authAction
  .inputSchema(z.object({ id: z.string(), timeZone: timeZoneSchema }))
  .action(async ({ parsedInput: { id, timeZone }, ctx: { user } }) => {
    const draft = await prisma.sentEmail.findFirst({
      where: { id, userId: user.id, isDraft: true },
    });

    if (!draft) {
      throw new ApplicationError("Brouillon introuvable");
    }
    if (!draft.missionId) {
      throw new ApplicationError("Ce brouillon n’est relié à aucune mission");
    }

    const mission = await assertOutreachAllowed({
      userId: user.id,
      missionId: draft.missionId,
      recipient: draft.to,
      timeZone,
    });
    await assertTemplateAllowed({
      templateId: draft.templateId ?? undefined,
      userId: user.id,
    });

    await prisma.sentEmail.update({
      where: { id },
      data: {
        status: "sending",
        failureReason: null,
        lastAttemptAt: new Date(),
      },
    });

    const emailResult = await sendEmail(
      {
        to: draft.to,
        subject: draft.subject,
        html: MarkdownEmail({
          markdown: draft.body,
          disabledSignature: true,
        }),
      },
      {
        idempotencyKey: `jobio-draft-${draft.id}`,
      },
    );

    if (emailResult.error) {
      await prisma.sentEmail.update({
        where: { id },
        data: {
          status: "failed",
          failureReason: sanitizeProviderFailure(emailResult.error.message),
        },
      });
      throw new ApplicationError(
        "L’email n’a pas été accepté par le fournisseur. Le brouillon est conservé pour réessayer.",
      );
    }

    return prisma.$transaction(async (tx) => {
      const sentEmail = await tx.sentEmail.update({
        where: { id },
        data: {
          isDraft: false,
          status: "sent",
          sentAt: new Date(),
          resendId: emailResult.data.id,
          failureReason: null,
        },
      });

      await tx.activityEvent.create({
        data: {
          missionId: mission.id,
          userId: user.id,
          type: "EMAIL_SENT",
          description: `Email envoyé à ${draft.to} : "${draft.subject}"`,
        },
      });

      if (draft.templateId) {
        await tx.messageTemplateUsage.create({
          data: {
            templateId: draft.templateId,
            userId: user.id,
            missionId: mission.id,
            channel: "email",
            source: "send_draft",
          },
        });
      }

      return sentEmail;
    });
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
