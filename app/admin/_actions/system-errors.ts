"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { ApplicationError } from "@/lib/errors/application-error";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma";
import { z } from "zod";
import { createAdminAuditLog } from "./admin-audit";

type GetSystemErrorOptions = {
  page: number;
  pageSize?: number;
  search?: string;
  severity?: "all" | "INFO" | "WARNING" | "ERROR" | "CRITICAL";
  status?: "all" | "open" | "resolved";
};

const isMissingSystemErrorTable = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError &&
  error.code === "P2021";

export const getSystemErrorLogs = async ({
  page,
  pageSize = 30,
  search,
  severity = "all",
  status = "all",
}: GetSystemErrorOptions) => {
  const whereClause: Prisma.SystemErrorLogWhereInput = {};

  if (search) {
    whereClause.OR = [
      {
        source: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        message: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        route: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        userEmail: {
          contains: search,
          mode: "insensitive",
        },
      },
    ];
  }

  if (severity !== "all") {
    whereClause.severity = severity;
  }

  if (status === "open") {
    whereClause.resolvedAt = null;
  }

  if (status === "resolved") {
    whereClause.resolvedAt = {
      not: null,
    };
  }

  let errors: Awaited<ReturnType<typeof prisma.systemErrorLog.findMany>>;
  let total: number;

  try {
    [errors, total] = await Promise.all([
      prisma.systemErrorLog.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.systemErrorLog.count({
        where: whereClause,
      }),
    ]);
  } catch (error) {
    if (isMissingSystemErrorTable(error)) {
      return {
        errors: [],
        total: 0,
        totalPages: 0,
      };
    }
    throw error;
  }

  return {
    errors,
    total,
    totalPages: Math.ceil(total / pageSize),
  };
};

const resolveErrorSchema = z.object({
  id: z.string(),
});

export const markSystemErrorResolvedAction = authAction
  .inputSchema(resolveErrorSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    if (user.role !== "admin") {
      throw new ApplicationError("Accès administrateur requis");
    }

    try {
      await prisma.systemErrorLog.update({
        where: { id: parsedInput.id },
        data: { resolvedAt: new Date() },
      });
    } catch (error) {
      if (isMissingSystemErrorTable(error)) {
        throw new ApplicationError(
          "La table de monitoring n'est pas encore disponible",
        );
      }
      throw error;
    }

    await createAdminAuditLog({
      action: "SYSTEM_ERROR_RESOLVED",
      actorUserId: user.id,
      actorEmail: user.email,
      metadata: {
        errorId: parsedInput.id,
      },
    });

    return { success: true };
  });
