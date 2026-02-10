"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { prisma } from "@/lib/prisma";

export const exportContactsAction = authAction.action(
  async ({ ctx: { user } }) => {
    const contacts = await prisma.contact.findMany({
      where: { userId: user.id, deletedAt: null },
      include: {
        _count: { select: { missions: true, interactions: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return contacts.map((c) => ({
      firstName: c.firstName,
      lastName: c.lastName,
      company: c.company ?? "",
      email: c.email ?? "",
      phone: c.phone ?? "",
      role: c.role ?? "",
      linkedinUrl: c.linkedinUrl ?? "",
      missions: c._count.missions,
      interactions: c._count.interactions,
      createdAt: c.createdAt.toISOString().split("T")[0],
    }));
  },
);
