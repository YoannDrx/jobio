import { authRoute } from "@/lib/zod-route";
import { prisma } from "@/lib/prisma";
import { enforcePlanLimit } from "@/lib/plan-limits";
import { computeMissionScore } from "@/features/missions/mission-scoring";
import { z } from "zod";

export const POST = authRoute
  .body(
    z.object({
      title: z.string().min(1),
      company: z.string().nullable().optional(),
      description: z.string().nullable().optional(),
      stack: z.array(z.string()).default([]),
      tjm: z.number().nullable().optional(),
      duration: z.string().nullable().optional(),
      workType: z.enum(["REMOTE", "HYBRID", "ONSITE"]).nullable().optional(),
      location: z.string().nullable().optional(),
      sourceUrl: z.string().nullable().optional(),
    }),
  )
  .handler(async (_req, { body, ctx }) => {
    await enforcePlanLimit(ctx.user.id, "missions");

    const mission = await prisma.mission.create({
      data: {
        userId: ctx.user.id,
        title: body.title,
        company: body.company ?? null,
        description: body.description ?? null,
        stack: body.stack,
        tjm: body.tjm ?? null,
        duration: body.duration ?? null,
        workType: body.workType ?? null,
        location: body.location ?? null,
        sourceUrl: body.sourceUrl ?? null,
      },
    });

    await prisma.activityEvent.create({
      data: {
        missionId: mission.id,
        userId: ctx.user.id,
        type: "MISSION_CREATED",
        description: `Mission "${mission.title}" capturée via extension Chrome`,
      },
    });

    const result = await computeMissionScore(mission.id, ctx.user.id);
    if (result.score > 0) {
      await prisma.mission.update({
        where: { id: mission.id },
        data: { score: result.score, scoreBreakdown: result.breakdown },
      });
    }

    return { ...mission, score: result.score };
  });
