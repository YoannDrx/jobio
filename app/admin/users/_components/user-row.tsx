"use client";

import { resolveActionResult } from "@/lib/actions/actions-utils";
import { authClient } from "@/lib/auth-client";
import { unwrapSafePromise } from "@/lib/promises";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Ban, Crown, Eye, MoreHorizontal, UserCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TableCell, TableRow } from "@/components/ui/table";
import { UserTableCell } from "../../_components/user-table-cell";
import type { UserWithStats } from "../_actions/admin-users";
import { createAdminAuditAction } from "@app/admin/_actions/admin-audit";

type UserRowProps = {
  user: UserWithStats;
};

const FRENCH_SHORT_MONTHS = [
  "janv.",
  "févr.",
  "mars",
  "avr.",
  "mai",
  "juin",
  "juil.",
  "août",
  "sept.",
  "oct.",
  "nov.",
  "déc.",
] as const;

const parisDatePartsFormatter = new Intl.DateTimeFormat("en-US", {
  day: "2-digit",
  hour: "2-digit",
  hourCycle: "h23",
  minute: "2-digit",
  month: "2-digit",
  timeZone: "Europe/Paris",
  year: "numeric",
});

const getParisDateParts = (value: Date) => {
  const parts = {
    day: "--",
    hour: "--",
    minute: "--",
    month: "1",
    year: "----",
  };

  for (const part of parisDatePartsFormatter.formatToParts(value)) {
    if (part.type in parts) {
      parts[part.type as keyof typeof parts] = part.value;
    }
  }
  const monthIndex = Number(parts.month) - 1;

  return {
    day: parts.day,
    hour: parts.hour,
    minute: parts.minute,
    month: FRENCH_SHORT_MONTHS[monthIndex] ?? "--",
    year: parts.year,
  };
};

const formatDate = (value: Date) => {
  const parts = getParisDateParts(value);
  return `${parts.day} ${parts.month} ${parts.year}`;
};

const formatDateTime = (value: Date) => {
  const parts = getParisDateParts(value);
  return `${parts.day} ${parts.month} à ${parts.hour}:${parts.minute}`;
};

export const UserRow = ({ user }: UserRowProps) => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const askReason = (actionLabel: string) => {
    const reason = window.prompt(
      `Raison obligatoire pour "${actionLabel}" (min 6 caractères)`,
    );
    if (!reason || reason.trim().length < 6) {
      toast.error("Raison obligatoire (6 caractères minimum)");
      return null;
    }
    return reason.trim();
  };

  const requestStrongConfirmation = (actionLabel: string) =>
    window.prompt(
      `Action sensible: ${actionLabel}\nTape CONFIRMER pour continuer.`,
    ) === "CONFIRMER";

  const logAdminAction = async (
    action: string,
    metadata?: Record<string, unknown>,
  ) => {
    try {
      await resolveActionResult(
        createAdminAuditAction({
          action,
          targetUserId: user.id,
          targetEmail: user.email,
          metadata,
        }),
      );
    } catch {
      // Ignore logging failure to keep admin actions responsive
    }
  };

  const onUserUpdate = () => {
    router.refresh();
  };

  const banUserMutation = useMutation({
    mutationFn: async ({
      userId,
      reason,
    }: {
      userId: string;
      reason: string;
    }) =>
      unwrapSafePromise(
        authClient.admin.banUser({
          userId,
          banReason: reason,
        }),
      ),
    onSuccess: (_data, variables) => {
      toast.success("Utilisateur banni");
      void logAdminAction("USER_BANNED", { reason: variables.reason });
      onUserUpdate();
    },
    onError: (error: Error) => {
      toast.error(`Impossible de bannir l'utilisateur: ${error.message}`);
    },
  });

  const unbanUserMutation = useMutation({
    mutationFn: async (userId: string) =>
      unwrapSafePromise(
        authClient.admin.unbanUser({
          userId,
        }),
      ),
    onSuccess: () => {
      toast.success("Utilisateur débanni");
      void logAdminAction("USER_UNBANNED");
      onUserUpdate();
    },
    onError: (error: Error) => {
      toast.error(`Impossible de débannir l'utilisateur: ${error.message}`);
    },
  });

  const impersonateMutation = useMutation({
    mutationFn: async ({
      userId,
      reason,
    }: {
      userId: string;
      reason: string;
    }) => {
      await logAdminAction("USER_IMPERSONATED", { reason });
      return unwrapSafePromise(
        authClient.admin.impersonateUser({
          userId,
        }),
      );
    },
    onSuccess: () => {
      toast.success("Impersonation démarrée");
      void queryClient.invalidateQueries();
      router.push("/job");
    },
    onError: (error: Error) => {
      toast.error(`Impossible d'impersonate l'utilisateur: ${error.message}`);
    },
  });

  const setRoleMutation = useMutation({
    mutationFn: async ({
      userId,
      role,
    }: {
      userId: string;
      role: "admin" | "user";
      reason: string;
    }) =>
      unwrapSafePromise(
        authClient.admin.setRole({
          userId,
          role,
        }),
      ),
    onSuccess: (_data, variables) => {
      toast.success("Rôle utilisateur mis à jour");
      void logAdminAction("USER_ROLE_UPDATED", {
        newRole: variables.role,
        reason: variables.reason,
      });
      onUserUpdate();
    },
    onError: (error: Error) => {
      toast.error(`Impossible de modifier le rôle: ${error.message}`);
    },
  });

  const planVariant = user.plan === "free" ? "secondary" : "default";

  return (
    <TableRow key={user.id}>
      <TableCell>
        <UserTableCell user={user} href={`/admin/users/${user.id}`} />
      </TableCell>
      <TableCell>
        <Badge variant={planVariant} className="capitalize">
          {user.plan}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge variant={user.role === "admin" ? "default" : "secondary"}>
          {user.role ?? "user"}
        </Badge>
      </TableCell>
      <TableCell>{user.missionsCount}</TableCell>
      <TableCell>{user.activeSessions}</TableCell>
      <TableCell>
        <div className="text-sm">{formatDateTime(user.lastActivityAt)}</div>
      </TableCell>
      <TableCell>
        <div className="text-sm">{formatDate(user.createdAt)}</div>
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              data-testid="user-row-menu-button"
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {!user.banned && (
              <DropdownMenuItem
                onClick={() => {
                  const reason = askReason("Impersonate utilisateur");
                  if (!reason) return;
                  if (!requestStrongConfirmation("Impersonate utilisateur"))
                    return;
                  impersonateMutation.mutate({
                    userId: user.id,
                    reason,
                  });
                }}
                disabled={impersonateMutation.isPending}
              >
                <Eye className="mr-2 size-4" />
                Impersonate
              </DropdownMenuItem>
            )}

            {user.role !== "admin" && (
              <DropdownMenuItem
                onClick={() => {
                  const reason = askReason("Passer admin");
                  if (!reason) return;
                  if (!requestStrongConfirmation("Passer admin")) return;
                  setRoleMutation.mutate({
                    userId: user.id,
                    role: "admin",
                    reason,
                  });
                }}
                disabled={setRoleMutation.isPending}
              >
                <Crown className="mr-2 size-4" />
                Passer admin
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />

            {user.banned ? (
              <DropdownMenuItem
                onClick={() => unbanUserMutation.mutate(user.id)}
                disabled={unbanUserMutation.isPending}
              >
                <UserCheck className="mr-2 size-4" />
                Débannir
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                onClick={() => {
                  const reason = askReason("Bannir l'utilisateur");
                  if (!reason) return;
                  if (!requestStrongConfirmation("Bannir l'utilisateur"))
                    return;
                  banUserMutation.mutate({ userId: user.id, reason });
                }}
                disabled={banUserMutation.isPending}
                variant="destructive"
              >
                <Ban className="mr-2 size-4" />
                Bannir
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
};
