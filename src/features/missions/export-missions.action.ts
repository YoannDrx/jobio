"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { prisma } from "@/lib/prisma";

export const exportMissionsAction = authAction.action(
  async ({ ctx: { user } }) => {
    const missions = await prisma.mission.findMany({
      where: { userId: user.id, deletedAt: null },
      include: {
        platform: { select: { name: true } },
        contact: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return missions.map((m) => ({
      title: m.title,
      company: m.company ?? "",
      status: m.status,
      priority: m.priority,
      tjm: m.tjm ?? "",
      duration: m.duration ?? "",
      workType: m.workType ?? "",
      location: m.location ?? "",
      stack: m.stack.join(", "),
      score: m.score,
      platform: m.platform?.name ?? "",
      contact: m.contact ? `${m.contact.firstName} ${m.contact.lastName}` : "",
      sourceUrl: m.sourceUrl ?? "",
      createdAt: m.createdAt.toISOString().split("T")[0],
    }));
  },
);
