"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const globalSearchAction = authAction
  .inputSchema(z.object({ query: z.string().min(2) }))
  .action(async ({ parsedInput: { query }, ctx: { user } }) => {
    const [missions, contacts] = await Promise.all([
      prisma.mission.findMany({
        where: {
          userId: user.id,
          deletedAt: null,
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { company: { contains: query, mode: "insensitive" } },
          ],
        },
        select: { id: true, title: true, company: true, status: true },
        take: 5,
        orderBy: { updatedAt: "desc" },
      }),
      prisma.contact.findMany({
        where: {
          userId: user.id,
          deletedAt: null,
          OR: [
            { firstName: { contains: query, mode: "insensitive" } },
            { lastName: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
            { company: { contains: query, mode: "insensitive" } },
          ],
        },
        select: { id: true, firstName: true, lastName: true, company: true },
        take: 5,
        orderBy: { updatedAt: "desc" },
      }),
    ]);

    return { missions, contacts };
  });
