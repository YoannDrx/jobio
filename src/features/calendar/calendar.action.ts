"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export type CalendarEvent = {
  id: string;
  title: string;
  date: Date;
  type: "follow_up";
  color: "blue";
  missionTitle?: string;
  missionId?: string;
  completed: boolean;
};

export const getCalendarEventsAction = authAction
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
            id: true,
            title: true,
          },
        },
      },
      orderBy: { scheduledAt: "asc" },
    });

    const events: CalendarEvent[] = followUps.map((followUp) => ({
      id: followUp.id,
      title: followUp.title,
      date: followUp.scheduledAt,
      type: "follow_up" as const,
      color: "blue" as const,
      missionTitle: followUp.mission.title,
      missionId: followUp.mission.id,
      completed: followUp.completedAt !== null,
    }));

    return events;
  });
