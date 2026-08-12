"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { ApplicationError } from "@/lib/errors/application-error";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { createAdminAuditLog } from "@app/admin/_actions/admin-audit";
import { getUsersWithStats } from "./admin-users";

const bulkUsersInputSchema = z.object({
  action: z.enum(["ban", "unban", "make_admin", "make_user"]),
  search: z.string().optional(),
  role: z.enum(["all", "admin", "user"]).default("all"),
  status: z.enum(["all", "active", "banned", "unverified"]).default("all"),
  plan: z.enum(["all", "free", "pro"]).default("all"),
  sortBy: z
    .enum([
      "createdAt",
      "name",
      "email",
      "missions",
      "sessions",
      "lastActivity",
    ])
    .default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
  maxUsers: z.number().min(1).max(2000).default(500),
});

type CollectUsersInput = z.infer<typeof bulkUsersInputSchema>;

const collectFilteredUserIds = async (input: CollectUsersInput) => {
  const pageSize = Math.min(200, input.maxUsers);
  const firstPage = await getUsersWithStats({
    page: 1,
    pageSize,
    search: input.search,
    role: input.role,
    status: input.status,
    plan: input.plan,
    sortBy: input.sortBy,
    order: input.order,
  });

  const pagesToLoad = Math.min(
    firstPage.totalPages,
    Math.ceil(input.maxUsers / pageSize),
  );

  const remainingPages =
    pagesToLoad > 1
      ? await Promise.all(
          Array.from({ length: pagesToLoad - 1 }, async (_, index) =>
            getUsersWithStats({
              page: index + 2,
              pageSize,
              search: input.search,
              role: input.role,
              status: input.status,
              plan: input.plan,
              sortBy: input.sortBy,
              order: input.order,
            }),
          ),
        )
      : [];

  const ids = [firstPage, ...remainingPages].flatMap((result) =>
    result.users.map((user) => user.id),
  );

  return ids.slice(0, input.maxUsers);
};

export const runBulkUsersAction = authAction
  .inputSchema(bulkUsersInputSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    if (user.role !== "admin") {
      throw new ApplicationError("Accès administrateur requis");
    }

    const allCandidateIds = await collectFilteredUserIds(parsedInput);
    if (allCandidateIds.length === 0) {
      throw new ApplicationError("Aucun utilisateur ne correspond aux filtres");
    }

    const targetIds = allCandidateIds.filter((id) => {
      if (parsedInput.action === "make_user" && id === user.id) return false;
      if (parsedInput.action === "ban" && id === user.id) return false;
      return true;
    });

    if (targetIds.length === 0) {
      throw new ApplicationError("Aucun utilisateur éligible à cette action");
    }

    let updatedCount = 0;

    if (parsedInput.action === "ban") {
      const result = await prisma.user.updateMany({
        where: { id: { in: targetIds } },
        data: {
          banned: true,
          banReason: "Banned in bulk by admin",
          banExpires: null,
        },
      });
      updatedCount = result.count;
    }

    if (parsedInput.action === "unban") {
      const result = await prisma.user.updateMany({
        where: { id: { in: targetIds } },
        data: {
          banned: false,
          banReason: null,
          banExpires: null,
        },
      });
      updatedCount = result.count;
    }

    if (parsedInput.action === "make_admin") {
      const result = await prisma.user.updateMany({
        where: { id: { in: targetIds } },
        data: {
          role: "admin",
        },
      });
      updatedCount = result.count;
    }

    if (parsedInput.action === "make_user") {
      const result = await prisma.user.updateMany({
        where: { id: { in: targetIds } },
        data: {
          role: "user",
        },
      });
      updatedCount = result.count;
    }

    await createAdminAuditLog({
      action: "USERS_BULK_UPDATED",
      actorUserId: user.id,
      actorEmail: user.email,
      metadata: {
        bulkAction: parsedInput.action,
        filters: {
          search: parsedInput.search ?? "",
          role: parsedInput.role,
          status: parsedInput.status,
          plan: parsedInput.plan,
          sortBy: parsedInput.sortBy,
          order: parsedInput.order,
        },
        maxUsers: parsedInput.maxUsers,
        candidates: allCandidateIds.length,
        targeted: targetIds.length,
        updated: updatedCount,
      },
    });

    return {
      updatedCount,
      targeted: targetIds.length,
      candidates: allCandidateIds.length,
    };
  });
