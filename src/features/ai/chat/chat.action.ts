"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { ApplicationError } from "@/lib/errors/application-error";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const getChatThreadsAction = authAction.action(
  async ({ ctx: { user } }) => {
    const threads = await prisma.aIChatThread.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      take: 50,
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return threads;
  },
);

const getChatThreadInputSchema = z.object({
  threadId: z.string(),
});

export const getChatThreadAction = authAction
  .inputSchema(getChatThreadInputSchema)
  .action(async ({ parsedInput: { threadId }, ctx: { user } }) => {
    const thread = await prisma.aIChatThread.findFirst({
      where: { id: threadId, userId: user.id },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!thread) {
      throw new ApplicationError("Conversation introuvable");
    }

    return thread;
  });

const createChatThreadInputSchema = z.object({
  title: z.string().optional(),
});

export const createChatThreadAction = authAction
  .inputSchema(createChatThreadInputSchema)
  .action(async ({ parsedInput: { title }, ctx: { user } }) => {
    const thread = await prisma.aIChatThread.create({
      data: {
        userId: user.id,
        title: title ?? "Nouvelle conversation",
      },
    });

    return thread;
  });

const deleteChatThreadInputSchema = z.object({
  threadId: z.string(),
});

export const deleteChatThreadAction = authAction
  .inputSchema(deleteChatThreadInputSchema)
  .action(async ({ parsedInput: { threadId }, ctx: { user } }) => {
    const thread = await prisma.aIChatThread.findFirst({
      where: { id: threadId, userId: user.id },
    });

    if (!thread) {
      throw new ApplicationError("Conversation introuvable");
    }

    await prisma.aIChatThread.delete({
      where: { id: threadId },
    });

    return { success: true };
  });
