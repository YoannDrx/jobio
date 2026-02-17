import { prisma } from "@/lib/prisma";

export async function trackTemplateUsage(input: {
  templateId: string;
  userId: string;
  missionId?: string;
  channel: string;
  source?: string;
}) {
  return prisma.messageTemplateUsage.create({
    data: {
      templateId: input.templateId,
      userId: input.userId,
      missionId: input.missionId,
      channel: input.channel,
      source: input.source,
    },
  });
}
