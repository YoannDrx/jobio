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

export const createFollowUpAction = authAction
  .inputSchema(createFollowUpSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    const mission = await prisma.mission.findFirst({
      where: { id: parsedInput.missionId, userId: user.id, deletedAt: null },
    });

    if (!mission) {
      throw new ApplicationError("Mission introuvable");
    }

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
        link: "/app",
      });
    }

    return followUp;
  });

export const completeFollowUpAction = authAction
  .inputSchema(completeFollowUpSchema)
  .action(async ({ parsedInput: { id }, ctx: { user } }) => {
    const followUp = await prisma.followUp.findFirst({
      where: { id, userId: user.id },
      include: { mission: { select: { title: true } } },
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
        link: `/app/pipeline`,
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
      link: "/app",
    });

    return updated;
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
