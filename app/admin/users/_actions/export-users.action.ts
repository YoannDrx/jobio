"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { ApplicationError } from "@/lib/errors/application-error";
import { z } from "zod";
import { getUsersForExport } from "./admin-users";
import { createAdminAuditLog } from "@app/admin/_actions/admin-audit";

const exportUsersInputSchema = z.object({
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
});

export const exportUsersAction = authAction
  .inputSchema(exportUsersInputSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    if (user.role !== "admin") {
      throw new ApplicationError("Accès administrateur requis");
    }

    const rows = await getUsersForExport(parsedInput);

    await createAdminAuditLog({
      action: "USERS_EXPORTED",
      actorUserId: user.id,
      actorEmail: user.email,
      metadata: {
        filters: parsedInput,
        exportedRows: rows.length,
      },
    });

    return rows;
  });
