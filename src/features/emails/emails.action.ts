"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const emailFilterSchema = z.object({
  page: z.number().default(1),
  pageSize: z.number().default(20),
  status: z.enum(["all", "sent", "draft"]).default("all"),
  search: z.string().optional(),
});

export const getAllSentEmailsAction = authAction
  .inputSchema(emailFilterSchema)
  .action(async ({ parsedInput: filters, ctx: { user } }) => {
    const where: Record<string, unknown> = { userId: user.id };

    if (filters.status === "sent") where.isDraft = false;
    if (filters.status === "draft") where.isDraft = true;

    if (filters.search) {
      where.OR = [
        { subject: { contains: filters.search, mode: "insensitive" } },
        { to: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const [emails, total] = await Promise.all([
      prisma.sentEmail.findMany({
        where,
        select: {
          id: true,
          to: true,
          subject: true,
          status: true,
          isDraft: true,
          createdAt: true,
          sentAt: true,
          mission: { select: { id: true, title: true, company: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize,
      }),
      prisma.sentEmail.count({ where }),
    ]);

    return {
      emails,
      total,
      page: filters.page,
      pageSize: filters.pageSize,
      totalPages: Math.ceil(total / filters.pageSize),
    };
  });
