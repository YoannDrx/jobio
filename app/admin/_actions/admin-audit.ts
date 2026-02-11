"use server";

import { prisma } from "@/lib/prisma";
import { authAction } from "@/lib/actions/safe-actions";
import { ApplicationError } from "@/lib/errors/application-error";
import { headers } from "next/headers";
import { Prisma } from "@/generated/prisma";
import { z } from "zod";

const createAdminAuditSchema = z.object({
  action: z.string().min(2).max(120),
  targetUserId: z.string().optional(),
  targetEmail: z.string().email().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

type CreateAdminAuditLogInput = {
  action: string;
  actorUserId: string;
  actorEmail: string;
  targetUserId?: string;
  targetEmail?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
};

const isMissingAuditTableError = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021";

export async function createAdminAuditLog(input: CreateAdminAuditLogInput) {
  try {
    return await prisma.adminAuditLog.create({
      data: {
        action: input.action,
        actorUserId: input.actorUserId,
        actorEmail: input.actorEmail,
        targetUserId: input.targetUserId,
        targetEmail: input.targetEmail,
        metadata: input.metadata as Prisma.InputJsonValue | undefined,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      },
    });
  } catch (error) {
    if (isMissingAuditTableError(error)) {
      return null;
    }
    throw error;
  }
}

export const createAdminAuditAction = authAction
  .inputSchema(createAdminAuditSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    if (user.role !== "admin") {
      throw new ApplicationError("Accès administrateur requis");
    }

    const requestHeaders = await headers();
    const xff = requestHeaders.get("x-forwarded-for");
    const ipAddress = xff?.split(",")[0]?.trim() ?? null;
    const userAgent = requestHeaders.get("user-agent");

    await createAdminAuditLog({
      action: parsedInput.action,
      actorUserId: user.id,
      actorEmail: user.email,
      targetUserId: parsedInput.targetUserId,
      targetEmail: parsedInput.targetEmail,
      metadata: parsedInput.metadata,
      ipAddress: ipAddress ?? undefined,
      userAgent: userAgent ?? undefined,
    });

    return { success: true };
  });

type GetAuditLogOptions = {
  page: number;
  pageSize?: number;
  search?: string;
  action?: string;
};

export const getAdminAuditLogs = async ({
  page,
  pageSize = 20,
  search,
  action,
}: GetAuditLogOptions) => {
  const whereClause: Prisma.AdminAuditLogWhereInput = {};

  if (search) {
    whereClause.OR = [
      {
        actorEmail: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        targetEmail: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        action: {
          contains: search,
          mode: "insensitive",
        },
      },
    ];
  }

  if (action) {
    whereClause.action = action;
  }

  let logs: Awaited<ReturnType<typeof prisma.adminAuditLog.findMany>>;
  let total: number;

  try {
    [logs, total] = await Promise.all([
      prisma.adminAuditLog.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.adminAuditLog.count({
        where: whereClause,
      }),
    ]);
  } catch (error) {
    if (isMissingAuditTableError(error)) {
      return {
        logs: [],
        total: 0,
        totalPages: 0,
      };
    }
    throw error;
  }

  return {
    logs,
    total,
    totalPages: Math.ceil(total / pageSize),
  };
};

export const getRecentAdminAuditLogs = async (limit = 8) => {
  try {
    return await prisma.adminAuditLog.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });
  } catch (error) {
    if (isMissingAuditTableError(error)) {
      return [];
    }
    throw error;
  }
};
