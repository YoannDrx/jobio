"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const getSnapshotsAction = authAction
  .inputSchema(
    z.object({
      type: z.enum(["DAILY", "WEEKLY", "MONTHLY"]),
      limit: z.number().min(1).max(100).default(30),
    }),
  )
  .action(async ({ parsedInput: { type, limit }, ctx: { user } }) => {
    const snapshots = await prisma.analyticsSnapshot.findMany({
      where: {
        userId: user.id,
        type,
      },
      orderBy: { date: "desc" },
      take: limit,
    });

    return snapshots;
  });
