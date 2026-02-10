"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { ApplicationError } from "@/lib/errors/application-error";
import { enforcePlanLimit } from "@/lib/plan-limits";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import {
  createMissionSchema,
  missionFilterSchema,
  updateMissionSchema,
  updateMissionStatusSchema,
} from "./missions.schema";
import { computeMissionScore } from "./mission-scoring";
import { createNotification } from "@/features/notifications/create-notification";

export const createMissionAction = authAction
  .inputSchema(createMissionSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    await enforcePlanLimit(user.id, "missions");

    const mission = await prisma.mission.create({
      data: {
        ...parsedInput,
        userId: user.id,
        sourceUrl: parsedInput.sourceUrl ?? null,
      },
    });

    await prisma.activityEvent.create({
      data: {
        missionId: mission.id,
        userId: user.id,
        type: "MISSION_CREATED",
        description: `Mission "${mission.title}" créée`,
      },
    });

    const score = await computeMissionScore(mission.id, user.id);
    if (score > 0) {
      await prisma.mission.update({
        where: { id: mission.id },
        data: { score },
      });
    }

    return mission;
  });

export const updateMissionAction = authAction
  .inputSchema(updateMissionSchema)
  .action(async ({ parsedInput: { id, ...data }, ctx: { user } }) => {
    const mission = await prisma.mission.findFirst({
      where: { id, userId: user.id, deletedAt: null },
    });

    if (!mission) {
      throw new ApplicationError("Mission introuvable");
    }

    const updated = await prisma.mission.update({
      where: { id },
      data: {
        ...data,
        sourceUrl: data.sourceUrl === "" ? null : data.sourceUrl,
      },
    });

    await prisma.activityEvent.create({
      data: {
        missionId: id,
        userId: user.id,
        type: "MISSION_UPDATED",
        description: `Mission "${updated.title}" mise à jour`,
      },
    });

    const score = await computeMissionScore(id, user.id);
    await prisma.mission.update({
      where: { id },
      data: { score },
    });

    return updated;
  });

export const updateMissionStatusAction = authAction
  .inputSchema(updateMissionStatusSchema)
  .action(async ({ parsedInput: { id, status }, ctx: { user } }) => {
    const mission = await prisma.mission.findFirst({
      where: { id, userId: user.id, deletedAt: null },
    });

    if (!mission) {
      throw new ApplicationError("Mission introuvable");
    }

    const updated = await prisma.mission.update({
      where: { id },
      data: { status },
    });

    await prisma.activityEvent.create({
      data: {
        missionId: id,
        userId: user.id,
        type: "STATUS_CHANGE",
        description: `Statut changé de ${mission.status} à ${status}`,
        previousValue: mission.status,
        newValue: status,
      },
    });

    if (status === "POSTULE") {
      await createNotification({
        userId: user.id,
        type: "SYSTEM",
        title: "Mission postulée !",
        message: `Pensez à planifier des relances pour "${updated.title}"`,
        link: `/app/pipeline?missionId=${id}`,
      });
    }

    if (status === "ENTRETIEN") {
      await createNotification({
        userId: user.id,
        type: "SYSTEM",
        title: "Entretien décroché !",
        message: `Mission "${updated.title}" chez ${updated.company ?? "?"} passe en entretien`,
        link: `/app/pipeline?missionId=${id}`,
      });
    }

    if (status === "ACCEPTE") {
      await createNotification({
        userId: user.id,
        type: "SYSTEM",
        title: "Mission acceptée !",
        message: `Félicitations ! Mission "${updated.title}" acceptée`,
        link: `/app/pipeline?missionId=${id}`,
      });
    }

    return updated;
  });

export const archiveMissionAction = authAction
  .inputSchema(z.object({ id: z.string() }))
  .action(async ({ parsedInput: { id }, ctx: { user } }) => {
    const mission = await prisma.mission.findFirst({
      where: { id, userId: user.id, deletedAt: null },
    });

    if (!mission) {
      throw new ApplicationError("Mission introuvable");
    }

    return prisma.mission.update({
      where: { id },
      data: { archivedAt: new Date(), status: "ARCHIVE" },
    });
  });

export const batchArchiveMissionsAction = authAction
  .inputSchema(z.object({ ids: z.array(z.string()).min(1) }))
  .action(async ({ parsedInput: { ids }, ctx: { user } }) => {
    const result = await prisma.mission.updateMany({
      where: { id: { in: ids }, userId: user.id, deletedAt: null },
      data: { archivedAt: new Date(), status: "ARCHIVE" },
    });
    return { archived: result.count };
  });

export const deleteMissionAction = authAction
  .inputSchema(z.object({ id: z.string() }))
  .action(async ({ parsedInput: { id }, ctx: { user } }) => {
    const mission = await prisma.mission.findFirst({
      where: { id, userId: user.id, deletedAt: null },
    });

    if (!mission) {
      throw new ApplicationError("Mission introuvable");
    }

    return prisma.mission.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  });

export const getMissionsAction = authAction
  .inputSchema(missionFilterSchema)
  .action(async ({ parsedInput: filters, ctx: { user } }) => {
    const where: Record<string, unknown> = {
      userId: user.id,
      deletedAt: null,
    };

    if (filters.status?.length) {
      where.status = { in: filters.status };
    }
    if (filters.priority?.length) {
      where.priority = { in: filters.priority };
    }
    if (filters.platformId) {
      where.platformId = filters.platformId;
    }
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: "insensitive" } },
        { company: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
      ];
    }
    if (filters.tjmMin !== undefined || filters.tjmMax !== undefined) {
      where.tjm = {};
      if (filters.tjmMin !== undefined) {
        (where.tjm as Record<string, number>).gte = filters.tjmMin;
      }
      if (filters.tjmMax !== undefined) {
        (where.tjm as Record<string, number>).lte = filters.tjmMax;
      }
    }

    const [missions, total, statusCounts] = await Promise.all([
      prisma.mission.findMany({
        where,
        include: {
          platform: true,
          contact: true,
          followUps: {
            where: { completedAt: null },
            orderBy: { scheduledAt: "asc" },
            take: 1,
          },
        },
        orderBy: { [filters.sortBy]: filters.sortOrder },
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize,
      }),
      prisma.mission.count({ where }),
      prisma.mission.groupBy({
        by: ["status"],
        where: { userId: user.id, deletedAt: null },
        _count: true,
      }),
    ]);

    const counters = Object.fromEntries(
      statusCounts.map((s) => [s.status, s._count]),
    );

    return {
      missions,
      total,
      counters,
      page: filters.page,
      pageSize: filters.pageSize,
      totalPages: Math.ceil(total / filters.pageSize),
    };
  });

export const getMissionAction = authAction
  .inputSchema(z.object({ id: z.string() }))
  .action(async ({ parsedInput: { id }, ctx: { user } }) => {
    const mission = await prisma.mission.findFirst({
      where: { id, userId: user.id, deletedAt: null },
      include: {
        platform: true,
        contact: true,
        profile: { select: { id: true, name: true } },
        followUps: {
          orderBy: { scheduledAt: "asc" },
        },
        activityEvents: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });

    if (!mission) {
      throw new ApplicationError("Mission introuvable");
    }

    return mission;
  });

export const recalculateScoreAction = authAction
  .inputSchema(z.object({ id: z.string() }))
  .action(async ({ parsedInput: { id }, ctx: { user } }) => {
    const mission = await prisma.mission.findFirst({
      where: { id, userId: user.id, deletedAt: null },
    });

    if (!mission) {
      throw new ApplicationError("Mission introuvable");
    }

    const score = await computeMissionScore(id, user.id);
    await prisma.mission.update({
      where: { id },
      data: { score },
    });

    return { score };
  });
