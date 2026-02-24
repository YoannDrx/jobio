"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { ApplicationError } from "@/lib/errors/application-error";
import { enforcePlanLimit } from "@/lib/plan-limits";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import {
  createMissionSchema,
  missionFilterSchema,
  missionStatusSchema,
  updateMissionSchema,
  updateMissionStatusSchema,
} from "./missions.schema";
import { computeMissionScore } from "./mission-scoring";
import { createNotification } from "@/features/notifications/create-notification";
import { Prisma } from "@/generated/prisma";

export const createMissionAction = authAction
  .inputSchema(createMissionSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    await enforcePlanLimit(user.id, "missions");

    const mission = await prisma.$transaction(async (tx) => {
      const created = await tx.mission.create({
        data: {
          ...parsedInput,
          userId: user.id,
          sourceUrl: parsedInput.sourceUrl ?? null,
        },
      });

      await tx.activityEvent.create({
        data: {
          missionId: created.id,
          userId: user.id,
          type: "MISSION_CREATED",
          description: `Mission "${created.title}" créée`,
        },
      });

      return created;
    });

    const result = await computeMissionScore(mission.id, user.id);
    if (result.score > 0) {
      await prisma.mission.update({
        where: { id: mission.id },
        data: { score: result.score, scoreBreakdown: result.breakdown },
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

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.mission.update({
        where: { id },
        data: {
          ...data,
          sourceUrl: data.sourceUrl === "" ? null : data.sourceUrl,
        },
      });

      await tx.activityEvent.create({
        data: {
          missionId: id,
          userId: user.id,
          type: "MISSION_UPDATED",
          description: `Mission "${result.title}" mise à jour`,
        },
      });

      return result;
    });

    const result = await computeMissionScore(id, user.id);
    await prisma.mission.update({
      where: { id },
      data: { score: result.score, scoreBreakdown: result.breakdown },
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
        message: `Pense à planifier des relances pour "${updated.title}"`,
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
    if (filters.workType?.length) {
      where.workType = { in: filters.workType };
    }
    if (filters.stack?.length) {
      where.stack = { hasSome: filters.stack };
    }
    if (filters.scoreMin !== undefined || filters.scoreMax !== undefined) {
      where.score = {};
      if (filters.scoreMin !== undefined)
        (where.score as Record<string, number>).gte = filters.scoreMin;
      if (filters.scoreMax !== undefined)
        (where.score as Record<string, number>).lte = filters.scoreMax;
    }

    const [missions, total, statusCounts] = await Promise.all([
      prisma.mission.findMany({
        where,
        select: {
          id: true,
          title: true,
          company: true,
          status: true,
          priority: true,
          tjm: true,
          duration: true,
          workType: true,
          location: true,
          score: true,
          createdAt: true,
          updatedAt: true,
          stack: true,
          platform: { select: { id: true, name: true } },
          contact: { select: { id: true, firstName: true, lastName: true } },
          followUps: {
            where: { completedAt: null },
            orderBy: { scheduledAt: "asc" },
            take: 1,
            select: { id: true, title: true, scheduledAt: true, type: true },
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

    const result = await computeMissionScore(id, user.id);
    await prisma.mission.update({
      where: { id },
      data: { score: result.score, scoreBreakdown: result.breakdown },
    });

    return result;
  });

export const bulkUpdateStatusAction = authAction
  .inputSchema(
    z.object({
      ids: z.array(z.string()).min(1),
      status: missionStatusSchema,
    }),
  )
  .action(async ({ parsedInput: { ids, status }, ctx: { user } }) => {
    const result = await prisma.mission.updateMany({
      where: { id: { in: ids }, userId: user.id, deletedAt: null },
      data: { status },
    });
    return { updated: result.count };
  });

export const bulkDeleteAction = authAction
  .inputSchema(z.object({ ids: z.array(z.string()).min(1) }))
  .action(async ({ parsedInput: { ids }, ctx: { user } }) => {
    const result = await prisma.mission.updateMany({
      where: { id: { in: ids }, userId: user.id, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    return { deleted: result.count };
  });

export const duplicateMissionAction = authAction
  .inputSchema(z.object({ id: z.string() }))
  .action(async ({ parsedInput: { id }, ctx: { user } }) => {
    const mission = await prisma.mission.findFirst({
      where: { id, userId: user.id, deletedAt: null },
    });

    if (!mission) {
      throw new ApplicationError("Mission introuvable");
    }

    const duplicated = await prisma.$transaction(async (tx) => {
      const created = await tx.mission.create({
        data: {
          title: `Copie de ${mission.title}`,
          company: mission.company,
          description: mission.description,
          status: "A_POSTULER",
          priority: mission.priority,
          tjm: mission.tjm,
          duration: mission.duration,
          workType: mission.workType,
          location: mission.location,
          stack: mission.stack,
          sourceUrl: mission.sourceUrl,
          platformId: mission.platformId,
          contactId: mission.contactId,
          profileId: mission.profileId,
          userId: user.id,
          score: 0,
          scoreBreakdown: Prisma.DbNull,
          notes: null,
          archivedAt: null,
          deletedAt: null,
        },
      });

      await tx.activityEvent.create({
        data: {
          missionId: created.id,
          userId: user.id,
          type: "MISSION_CREATED",
          description: `Mission dupliquée depuis "${mission.title}"`,
        },
      });

      return created;
    });

    const result = await computeMissionScore(duplicated.id, user.id);
    await prisma.mission.update({
      where: { id: duplicated.id },
      data: { score: result.score, scoreBreakdown: result.breakdown },
    });

    return duplicated;
  });

export const updateRejectionReasonAction = authAction
  .inputSchema(
    z.object({
      id: z.string(),
      rejectionReason: z.string().nullable(),
    }),
  )
  .action(async ({ parsedInput: { id, rejectionReason }, ctx: { user } }) => {
    const mission = await prisma.mission.findFirst({
      where: { id, userId: user.id, deletedAt: null },
    });

    if (!mission) {
      throw new ApplicationError("Mission introuvable");
    }

    if (mission.status !== "REFUSE") {
      throw new ApplicationError(
        "La mission doit être au statut REFUSE pour ajouter une raison de refus",
      );
    }

    const updated = await prisma.mission.update({
      where: { id },
      data: { rejectionReason },
    });

    await prisma.activityEvent.create({
      data: {
        missionId: id,
        userId: user.id,
        type: "MISSION_UPDATED",
        description: "Raison de refus ajoutée",
      },
    });

    return updated;
  });
