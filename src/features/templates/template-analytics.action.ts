"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { prisma } from "@/lib/prisma";

export const getTemplateAnalyticsAction = authAction.action(
  async ({ ctx: { user } }) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [topTemplates, monthlyCount] = await Promise.all([
      prisma.messageTemplateUsage.groupBy({
        by: ["templateId"],
        where: { userId: user.id },
        _count: { id: true },
        _max: { createdAt: true },
        orderBy: { _count: { id: "desc" } },
        take: 5,
      }),
      prisma.messageTemplateUsage.count({
        where: {
          userId: user.id,
          createdAt: { gte: startOfMonth },
        },
      }),
    ]);

    const templateIds = topTemplates.map((t) => t.templateId);
    const templates = await prisma.messageTemplate.findMany({
      where: { id: { in: templateIds } },
      select: { id: true, name: true, type: true },
    });

    const templateMap = new Map(templates.map((t) => [t.id, t]));

    const analytics = topTemplates.map((t) => ({
      templateId: t.templateId,
      name: templateMap.get(t.templateId)?.name ?? "Template supprime",
      type: templateMap.get(t.templateId)?.type ?? null,
      count: t._count.id,
      lastUsedAt: t._max.createdAt,
    }));

    return {
      topTemplates: analytics,
      monthlyTotal: monthlyCount,
    };
  },
);
