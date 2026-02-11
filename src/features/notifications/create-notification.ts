import type { NotificationType } from "@/generated/prisma";
import type { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";

export async function createNotification(data: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, unknown>;
  dedupeHours?: number;
}) {
  const since = new Date(
    Date.now() - (data.dedupeHours ?? 24) * 60 * 60 * 1000,
  );

  const existing = await prisma.notification.findFirst({
    where: {
      userId: data.userId,
      type: data.type,
      title: data.title,
      read: false,
      createdAt: { gte: since },
    },
  });

  if (existing) {
    return existing;
  }

  return prisma.notification.create({
    data: {
      userId: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      link: data.link,
      metadata: data.metadata as Prisma.InputJsonValue | undefined,
    },
  });
}
