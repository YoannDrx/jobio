"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { ApplicationError } from "@/lib/errors/application-error";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import {
  completeFollowUpSchema,
  createFollowUpSchema,
  snoozeFollowUpSchema,
  updateFollowUpSchema,
} from "./follow-ups.schema";
import { createNotification } from "@/features/notifications/create-notification";
import { isFeatureEnabled } from "@/lib/ops/feature-flags";
import {
  evaluateFollowUpPolicy,
  FOLLOW_UP_POLICY_MESSAGES,
} from "./follow-up-policy";

const getFollowUpPolicyContext = async (params: {
  userId: string;
  missionId: string;
  scheduledAt: Date;
  excludeFollowUpId?: string;
}) => {
  const mission = await prisma.mission.findFirst({
    where: {
      id: params.missionId,
      userId: params.userId,
      deletedAt: null,
    },
    include: {
      contact: { select: { id: true, tags: true, deletedAt: true } },
    },
  });

  if (!mission) throw new ApplicationError("Mission introuvable");

  const windowStart = new Date(
    params.scheduledAt.getTime() - 24 * 60 * 60 * 1000,
  );
  const windowEnd = new Date(
    params.scheduledAt.getTime() + 24 * 60 * 60 * 1000,
  );
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [pendingNearTarget, recentSentEmails, recentCompletedFollowUps] =
    await Promise.all([
      prisma.followUp.count({
        where: {
          userId: params.userId,
          missionId: params.missionId,
          completedAt: null,
          scheduledAt: { gte: windowStart, lte: windowEnd },
          ...(params.excludeFollowUpId
            ? { id: { not: params.excludeFollowUpId } }
            : {}),
        },
      }),
      mission.contactId
        ? prisma.sentEmail.count({
            where: {
              userId: params.userId,
              contactId: mission.contactId,
              isDraft: false,
              OR: [
                { sentAt: { gte: sevenDaysAgo } },
                { sentAt: null, createdAt: { gte: sevenDaysAgo } },
              ],
            },
          })
        : Promise.resolve(0),
      mission.contactId
        ? prisma.followUp.count({
            where: {
              userId: params.userId,
              completedAt: { gte: sevenDaysAgo },
              mission: { contactId: mission.contactId },
              ...(params.excludeFollowUpId
                ? { id: { not: params.excludeFollowUpId } }
                : {}),
            },
          })
        : Promise.resolve(0),
    ]);

  return {
    mission,
    pendingNearTarget,
    recentContactTouches: recentSentEmails + recentCompletedFollowUps,
  };
};

const assertFollowUpAllowed = async (params: {
  userId: string;
  missionId: string;
  scheduledAt: Date;
  excludeFollowUpId?: string;
}) => {
  if (params.scheduledAt <= new Date()) {
    throw new ApplicationError("La date de relance doit être dans le futur");
  }

  const context = await getFollowUpPolicyContext(params);
  const reason = evaluateFollowUpPolicy({
    missionStatus: context.mission.status,
    isAutomated: false,
    contactTags: context.mission.contact
      ? context.mission.contact.deletedAt === null
        ? context.mission.contact.tags
        : ["do-not-contact"]
      : [],
    pendingNearTarget: context.pendingNearTarget,
    recentContactTouches: context.recentContactTouches,
  });

  if (reason) throw new ApplicationError(FOLLOW_UP_POLICY_MESSAGES[reason]);
  return context.mission;
};

export const createFollowUpAction = authAction
  .inputSchema(createFollowUpSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    const mission = await assertFollowUpAllowed({
      userId: user.id,
      missionId: parsedInput.missionId,
      scheduledAt: parsedInput.scheduledAt,
    });

    const followUp = await prisma.followUp.create({
      data: {
        ...parsedInput,
        userId: user.id,
      },
    });

    await prisma.activityEvent.create({
      data: {
        missionId: mission.id,
        userId: user.id,
        type: "FOLLOW_UP_CREATED",
        description: `Relance "${followUp.title}" planifiée`,
      },
    });

    const now = new Date();
    const isDueToday =
      followUp.scheduledAt >=
        new Date(now.getFullYear(), now.getMonth(), now.getDate()) &&
      followUp.scheduledAt <=
        new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    if (isDueToday) {
      await createNotification({
        userId: user.id,
        type: "FOLLOW_UP_DUE",
        title: "Relance planifiée aujourd'hui",
        message: `La relance "${followUp.title}" sur "${mission.title}" est prévue aujourd'hui`,
        link: `/app/pipeline?missionId=${mission.id}`,
      });
    }

    return followUp;
  });

const batchCreateFollowUpsSchema = z.object({
  missionIds: z.array(z.string()).min(1).max(100),
  type: z.enum(["EMAIL", "CALL", "MESSAGE", "MEETING"]),
  title: z.string().min(2).max(160),
  description: z.string().max(2000).optional(),
  scheduledAt: z.date(),
  skipIfPendingWithinDays: z.number().min(0).max(90).default(7),
});

export const batchCreateFollowUpsAction = authAction
  .inputSchema(batchCreateFollowUpsSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    const enabled = await isFeatureEnabled("assistant.batch_followups");
    if (!enabled) {
      throw new ApplicationError("La planification batch est désactivée");
    }

    const missions = await prisma.mission.findMany({
      where: {
        id: { in: parsedInput.missionIds },
        userId: user.id,
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
      },
    });

    if (missions.length === 0) {
      throw new ApplicationError("Aucune mission valide pour cette action");
    }

    const now = new Date();
    const pendingLimitDate = new Date(now);
    pendingLimitDate.setDate(
      pendingLimitDate.getDate() + parsedInput.skipIfPendingWithinDays,
    );

    const pendingFollowUps = await prisma.followUp.findMany({
      where: {
        userId: user.id,
        missionId: { in: missions.map((mission) => mission.id) },
        completedAt: null,
        scheduledAt: {
          gte: now,
          lte: pendingLimitDate,
        },
      },
      select: {
        missionId: true,
      },
    });

    const missionWithPendingFollowUp = new Set(
      pendingFollowUps.map((followUp) => followUp.missionId),
    );

    const eligibleMissions = missions.filter(
      (mission) => !missionWithPendingFollowUp.has(mission.id),
    );

    if (eligibleMissions.length === 0) {
      throw new ApplicationError(
        "Toutes les missions ciblées ont déjà une relance proche",
      );
    }

    await prisma.$transaction(async (tx) => {
      await Promise.all(
        eligibleMissions.map(async (mission) => {
          await tx.followUp.create({
            data: {
              missionId: mission.id,
              userId: user.id,
              type: parsedInput.type,
              title: parsedInput.title,
              description: parsedInput.description,
              scheduledAt: parsedInput.scheduledAt,
            },
          });

          await tx.activityEvent.create({
            data: {
              missionId: mission.id,
              userId: user.id,
              type: "FOLLOW_UP_CREATED",
              description: `Relance batch "${parsedInput.title}" planifiée`,
            },
          });
        }),
      );
    });

    return {
      targetedCount: missions.length,
      createdCount: eligibleMissions.length,
      skippedCount: missions.length - eligibleMissions.length,
    };
  });

export const completeFollowUpAction = authAction
  .inputSchema(completeFollowUpSchema)
  .action(async ({ parsedInput: { id }, ctx: { user } }) => {
    const followUp = await prisma.followUp.findFirst({
      where: { id, userId: user.id },
      include: { mission: { select: { id: true, title: true } } },
    });

    if (!followUp) {
      throw new ApplicationError("Relance introuvable");
    }

    if (followUp.completedAt) {
      throw new ApplicationError("Cette relance est déjà complétée");
    }

    const updated = await prisma.followUp.update({
      where: { id },
      data: { completedAt: new Date() },
    });

    await prisma.activityEvent.create({
      data: {
        missionId: followUp.missionId,
        userId: user.id,
        type: "FOLLOW_UP_COMPLETED",
        description: `Relance "${followUp.title}" complétée`,
      },
    });

    const isOverdue = followUp.scheduledAt < new Date();
    if (isOverdue) {
      await createNotification({
        userId: user.id,
        type: "FOLLOW_UP_OVERDUE",
        title: "Relance en retard complétée",
        message: `Relance "${followUp.title}" pour "${followUp.mission.title}" complétée`,
        link: `/app/pipeline?missionId=${followUp.mission.id}`,
      });
    }

    return updated;
  });

export const updateFollowUpAction = authAction
  .inputSchema(updateFollowUpSchema)
  .action(async ({ parsedInput: { id, ...data }, ctx: { user } }) => {
    const followUp = await prisma.followUp.findFirst({
      where: { id, userId: user.id },
    });

    if (!followUp) {
      throw new ApplicationError("Relance introuvable");
    }

    await assertFollowUpAllowed({
      userId: user.id,
      missionId: followUp.missionId,
      scheduledAt: data.scheduledAt ?? followUp.scheduledAt,
      excludeFollowUpId: id,
    });

    const updated = await prisma.followUp.update({
      where: { id },
      data,
    });

    await prisma.activityEvent.create({
      data: {
        missionId: followUp.missionId,
        userId: user.id,
        type: "MISSION_UPDATED",
        description: `Relance "${updated.title}" mise à jour`,
      },
    });

    return updated;
  });

export const deleteFollowUpAction = authAction
  .inputSchema(z.object({ id: z.string() }))
  .action(async ({ parsedInput: { id }, ctx: { user } }) => {
    const followUp = await prisma.followUp.findFirst({
      where: { id, userId: user.id },
      include: { mission: true },
    });

    if (!followUp) {
      throw new ApplicationError("Relance introuvable");
    }

    await prisma.followUp.delete({
      where: { id },
    });

    await prisma.activityEvent.create({
      data: {
        missionId: followUp.missionId,
        userId: user.id,
        type: "MISSION_UPDATED",
        description: `Relance "${followUp.title}" supprimée`,
      },
    });

    return { deleted: true };
  });

export const snoozeFollowUpAction = authAction
  .inputSchema(snoozeFollowUpSchema)
  .action(async ({ parsedInput: { id, scheduledAt }, ctx: { user } }) => {
    const followUp = await prisma.followUp.findFirst({
      where: { id, userId: user.id },
      include: { mission: true },
    });

    if (!followUp) {
      throw new ApplicationError("Relance introuvable");
    }

    if (followUp.completedAt) {
      throw new ApplicationError(
        "Impossible de reporter une relance complétée",
      );
    }

    if (scheduledAt <= new Date()) {
      throw new ApplicationError("La nouvelle date doit être dans le futur");
    }

    await assertFollowUpAllowed({
      userId: user.id,
      missionId: followUp.missionId,
      scheduledAt,
      excludeFollowUpId: id,
    });

    const updated = await prisma.followUp.update({
      where: { id },
      data: {
        scheduledAt,
        isOverdue: false,
      },
    });

    const previousDate = followUp.scheduledAt.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
    const nextDate = scheduledAt.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

    await prisma.activityEvent.create({
      data: {
        missionId: followUp.missionId,
        userId: user.id,
        type: "MISSION_UPDATED",
        description: `Relance "${followUp.title}" reportée (${previousDate} -> ${nextDate})`,
      },
    });

    await createNotification({
      userId: user.id,
      type: "FOLLOW_UP_DUE",
      title: "Relance reportée",
      message: `La relance "${followUp.title}" a été reportée au ${nextDate}`,
      link: `/app/pipeline?missionId=${followUp.mission.id}`,
    });

    return updated;
  });

const followUpTypeSchema = z.enum(["EMAIL", "CALL", "MESSAGE", "MEETING"]);

export const getFollowUpsAction = authAction
  .inputSchema(
    z.object({
      includeCompleted: z.boolean().default(true),
      types: z.array(followUpTypeSchema).optional(),
      startAt: z.date().optional(),
      endAt: z.date().optional(),
    }),
  )
  .action(async ({ parsedInput, ctx: { user } }) => {
    const where: {
      userId: string;
      completedAt?: null;
      type?: { in: ("EMAIL" | "CALL" | "MESSAGE" | "MEETING")[] };
      scheduledAt?: {
        gte?: Date;
        lte?: Date;
      };
    } = {
      userId: user.id,
    };

    if (!parsedInput.includeCompleted) {
      where.completedAt = null;
    }

    if (parsedInput.types && parsedInput.types.length > 0) {
      where.type = { in: parsedInput.types };
    }

    if (parsedInput.startAt || parsedInput.endAt) {
      where.scheduledAt = {
        ...(parsedInput.startAt ? { gte: parsedInput.startAt } : {}),
        ...(parsedInput.endAt ? { lte: parsedInput.endAt } : {}),
      };
    }

    const followUps = await prisma.followUp.findMany({
      where,
      include: {
        mission: {
          select: {
            id: true,
            title: true,
            company: true,
          },
        },
      },
      orderBy: { scheduledAt: "asc" },
    });

    return followUps;
  });

export const getFollowUpsByMissionAction = authAction
  .inputSchema(z.object({ missionId: z.string() }))
  .action(async ({ parsedInput: { missionId }, ctx: { user } }) => {
    const mission = await prisma.mission.findFirst({
      where: { id: missionId, userId: user.id, deletedAt: null },
    });

    if (!mission) {
      throw new ApplicationError("Mission introuvable");
    }

    const followUps = await prisma.followUp.findMany({
      where: { missionId, userId: user.id },
      orderBy: { scheduledAt: "asc" },
    });

    return followUps;
  });

export const getOverdueFollowUpsAction = authAction
  .inputSchema(z.object({}))
  .action(async ({ ctx: { user } }) => {
    const now = new Date();

    const followUps = await prisma.followUp.findMany({
      where: {
        userId: user.id,
        scheduledAt: { lt: now },
        completedAt: null,
      },
      include: {
        mission: {
          select: {
            title: true,
            company: true,
            status: true,
          },
        },
      },
      orderBy: { scheduledAt: "asc" },
    });

    return followUps;
  });

export const getTodayFollowUpsAction = authAction
  .inputSchema(z.object({}))
  .action(async ({ ctx: { user } }) => {
    const now = new Date();
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const endOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999,
    );

    const followUps = await prisma.followUp.findMany({
      where: {
        userId: user.id,
        scheduledAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
        completedAt: null,
      },
      include: {
        mission: {
          select: {
            title: true,
            company: true,
            status: true,
          },
        },
      },
      orderBy: { scheduledAt: "asc" },
    });

    return followUps;
  });

export const getFollowUpsForCalendarAction = authAction
  .inputSchema(
    z.object({
      month: z.number().min(1).max(12),
      year: z.number(),
    }),
  )
  .action(async ({ parsedInput: { month, year }, ctx: { user } }) => {
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    const followUps = await prisma.followUp.findMany({
      where: {
        userId: user.id,
        scheduledAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      include: {
        mission: {
          select: {
            title: true,
            company: true,
          },
        },
      },
      orderBy: { scheduledAt: "asc" },
    });

    return followUps;
  });
