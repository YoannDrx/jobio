"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const getTodayStrategyAction = authAction.action(
  async ({ ctx: { user } }) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const strategy = await prisma.dailyStrategy.findUnique({
      where: { userId_date: { userId: user.id, date: today } },
    });

    return strategy;
  },
);

export const toggleStrategyItemAction = authAction
  .inputSchema(
    z.object({
      id: z.string(),
      field: z.enum(["priorities", "quickWins"]),
      index: z.number(),
    }),
  )
  .action(async ({ parsedInput: { id, field, index }, ctx: { user } }) => {
    const strategy = await prisma.dailyStrategy.findFirst({
      where: { id, userId: user.id },
    });

    if (!strategy) throw new Error("Stratégie introuvable");

    const completedField =
      field === "priorities" ? "completedPriorities" : "completedQuickWins";
    const completed = strategy[completedField] as number[];

    const newCompleted = completed.includes(index)
      ? completed.filter((i) => i !== index)
      : [...completed, index];

    return prisma.dailyStrategy.update({
      where: { id },
      data: { [completedField]: newCompleted },
    });
  });

export const deleteStrategyAction = authAction
  .inputSchema(z.object({ id: z.string() }))
  .action(async ({ parsedInput: { id }, ctx: { user } }) => {
    await prisma.dailyStrategy.deleteMany({
      where: { id, userId: user.id },
    });
    return { success: true };
  });
