"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { prisma } from "@/lib/prisma";

export const getOrCreateFeedTokenAction = authAction.action(
  async ({ ctx: { user } }) => {
    const existing = await prisma.calendarFeedToken.findUnique({
      where: { userId: user.id },
    });

    if (existing) {
      return { token: existing.token };
    }

    const created = await prisma.calendarFeedToken.create({
      data: {
        userId: user.id,
      },
    });

    return { token: created.token };
  },
);
