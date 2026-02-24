"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { enforcePlanFeature } from "@/lib/plan-limits";
import { prisma } from "@/lib/prisma";
import {
  MISSION_STATUS_LABELS,
  PIPELINE_STATUS_VALUES,
} from "@/features/missions/mission-status";
import { exportMissionFilterSchema } from "./missions.schema";

export const exportMissionsAction = authAction
  .inputSchema(exportMissionFilterSchema)
  .action(async ({ parsedInput: filters, ctx: { user } }) => {
    await enforcePlanFeature(user.id, "csvExport");
    const where: Record<string, unknown> = {
      userId: user.id,
      deletedAt: null,
    };

    if (filters.status?.length) {
      where.status = { in: filters.status };
    } else {
      where.status = { in: [...PIPELINE_STATUS_VALUES] };
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
      if (filters.scoreMin !== undefined) {
        (where.score as Record<string, number>).gte = filters.scoreMin;
      }
      if (filters.scoreMax !== undefined) {
        (where.score as Record<string, number>).lte = filters.scoreMax;
      }
    }

    const missions = await prisma.mission.findMany({
      where,
      include: {
        platform: { select: { name: true } },
        contact: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return missions.map((m) => ({
      title: m.title,
      company: m.company ?? "",
      status: MISSION_STATUS_LABELS[m.status],
      priority: m.priority,
      tjm: m.tjm ?? "",
      duration: m.duration ?? "",
      workType: m.workType ?? "",
      location: m.location ?? "",
      stack: m.stack.join(", "),
      score: m.score,
      platform: m.platform?.name ?? "",
      contact: m.contact ? `${m.contact.firstName} ${m.contact.lastName}` : "",
      sourceUrl: m.sourceUrl ?? "",
      createdAt: m.createdAt.toISOString().split("T")[0],
    }));
  });
