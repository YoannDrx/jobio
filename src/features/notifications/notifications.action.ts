"use server";

import type { Prisma } from "@/generated/prisma";
import { NotificationType } from "@/generated/prisma";
import { authAction } from "@/lib/actions/safe-actions";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const getNotificationsAction = authAction
  .inputSchema(z.void())
  .action(async ({ ctx: { user } }) => {
    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.notification.count({
        where: { userId: user.id, read: false },
      }),
    ]);

    return { notifications, unreadCount };
  });

export const markAsReadAction = authAction
  .inputSchema(z.object({ id: z.string() }))
  .action(async ({ parsedInput: { id }, ctx: { user } }) => {
    await prisma.notification.updateMany({
      where: { id, userId: user.id },
      data: { read: true },
    });

    return { success: true };
  });

export const markAllAsReadAction = authAction
  .inputSchema(z.void())
  .action(async ({ ctx: { user } }) => {
    await prisma.notification.updateMany({
      where: { userId: user.id, read: false },
      data: { read: true },
    });

    return { success: true };
  });

export const getAllNotificationsAction = authAction
  .inputSchema(
    z.object({
      page: z.number().int().min(1).default(1),
      pageSize: z.number().int().min(1).max(100).default(20),
      type: z.nativeEnum(NotificationType).optional(),
      readStatus: z.enum(["all", "read", "unread"]).default("all"),
    }),
  )
  .action(async ({ parsedInput, ctx: { user } }) => {
    const where: Record<string, unknown> = { userId: user.id };

    if (parsedInput.type) {
      where.type = parsedInput.type;
    }

    if (parsedInput.readStatus === "read") {
      where.read = true;
    } else if (parsedInput.readStatus === "unread") {
      where.read = false;
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (parsedInput.page - 1) * parsedInput.pageSize,
        take: parsedInput.pageSize,
      }),
      prisma.notification.count({ where }),
    ]);

    return {
      notifications,
      total,
      page: parsedInput.page,
      pageSize: parsedInput.pageSize,
      totalPages: Math.ceil(total / parsedInput.pageSize),
    };
  });

export const deleteNotificationAction = authAction
  .inputSchema(z.object({ id: z.string() }))
  .action(async ({ parsedInput: { id }, ctx: { user } }) => {
    await prisma.notification.deleteMany({
      where: { id, userId: user.id },
    });
    return { success: true };
  });

export const deleteAllReadAction = authAction
  .inputSchema(z.void())
  .action(async ({ ctx: { user } }) => {
    await prisma.notification.deleteMany({
      where: { userId: user.id, read: true },
    });
    return { success: true };
  });

export const createNotificationAction = authAction
  .inputSchema(
    z.object({
      type: z.nativeEnum(NotificationType),
      title: z.string(),
      message: z.string(),
      link: z.string().optional(),
      metadata: z.record(z.string(), z.unknown()).optional(),
    }),
  )
  .action(async ({ parsedInput, ctx: { user } }) => {
    const notification = await prisma.notification.create({
      data: {
        userId: user.id,
        type: parsedInput.type,
        title: parsedInput.title,
        message: parsedInput.message,
        link: parsedInput.link ?? null,
        metadata: parsedInput.metadata as Prisma.InputJsonValue | undefined,
      },
    });

    return notification;
  });
