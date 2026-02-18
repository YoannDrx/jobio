"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { authClient } from "@/lib/auth-client";
import { unwrapSafePromise } from "@/lib/promises";
import { useMutation } from "@tanstack/react-query";
import { Ban, Crown, Eye, MoreHorizontal, UserCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createAdminAuditAction } from "@app/admin/_actions/admin-audit";

type User = {
  id: string;
  name: string;
  email: string;
  role?: string | null;
  banned?: boolean | null;
};

type UserActionsProps = {
  user: User;
};

export function UserActions({ user }: UserActionsProps) {
  const router = useRouter();

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
      // Keep primary action responsive even if logging fails
    }
  };

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
      router.push("/job");
    },
    onError: (error: Error) => {
      toast.error(`Impossible d'impersonate l'utilisateur: ${error.message}`);
    },
  });

  const banUserMutation = useMutation({
    mutationFn: async ({
      userId,
      reason,
    }: {
      userId: string;
      reason: string;
    }) => {
      return unwrapSafePromise(
        authClient.admin.banUser({
          userId,
          banReason: reason,
        }),
      );
    },
    onSuccess: (_data, variables) => {
      toast.success("Utilisateur banni");
      void logAdminAction("USER_BANNED", { reason: variables.reason });
      router.refresh();
    },
    onError: (error: Error) => {
      toast.error(`Impossible de bannir l'utilisateur: ${error.message}`);
    },
  });

  const unbanUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return unwrapSafePromise(
        authClient.admin.unbanUser({
          userId,
        }),
      );
    },
    onSuccess: () => {
      toast.success("Utilisateur débanni");
      void logAdminAction("USER_UNBANNED");
      router.refresh();
    },
    onError: (error: Error) => {
      toast.error(`Impossible de débannir l'utilisateur: ${error.message}`);
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
    }) => {
      return unwrapSafePromise(
        authClient.admin.setRole({
          userId,
          role,
        }),
      );
    },
    onSuccess: (_data, variables) => {
      toast.success("Rôle utilisateur mis à jour");
      void logAdminAction("USER_ROLE_UPDATED", {
        newRole: variables.role,
        reason: variables.reason,
      });
      router.refresh();
    },
    onError: (error: Error) => {
      toast.error(`Impossible de modifier le rôle: ${error.message}`);
    },
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <MoreHorizontal className="mr-2 size-4" />
          Actions admin
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {!user.banned && (
          <DropdownMenuItem
            onClick={() => {
              const reason = askReason("Impersonate utilisateur");
              if (!reason) return;
              if (!requestStrongConfirmation("Impersonate utilisateur")) return;
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
                role: "admin" as const,
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
              if (!requestStrongConfirmation("Bannir l'utilisateur")) return;
              banUserMutation.mutate({ userId: user.id, reason });
            }}
            disabled={banUserMutation.isPending}
            className="text-destructive focus:text-destructive"
          >
            <Ban className="mr-2 size-4" />
            Bannir
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
