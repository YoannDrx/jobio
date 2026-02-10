import type { NotificationType } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";

export async function createNotification(data: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}) {
  return prisma.notification.create({ data });
}
