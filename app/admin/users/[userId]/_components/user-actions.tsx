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

  const logAdminAction = async (action: string, metadata?: Record<string, unknown>) => {
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
    mutationFn: async (userId: string) => {
      await logAdminAction("USER_IMPERSONATED");
      return unwrapSafePromise(
        authClient.admin.impersonateUser({
          userId,
        }),
      );
    },
    onSuccess: () => {
      toast.success("Impersonation démarrée");
      router.push("/app");
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
      reason?: string;
    }) => {
      return unwrapSafePromise(
        authClient.admin.banUser({
          userId,
          banReason: reason ?? "Banned by admin",
        }),
      );
    },
    onSuccess: () => {
      toast.success("Utilisateur banni");
      void logAdminAction("USER_BANNED");
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
    }) => {
      return unwrapSafePromise(
        authClient.admin.setRole({
          userId,
          role,
        }),
      );
    },
    onSuccess: () => {
      toast.success("Rôle utilisateur mis à jour");
      void logAdminAction("USER_ROLE_UPDATED", {
        newRole: "admin",
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
            onClick={() => impersonateMutation.mutate(user.id)}
            disabled={impersonateMutation.isPending}
          >
            <Eye className="mr-2 size-4" />
            Impersonate
          </DropdownMenuItem>
        )}

        {user.role !== "admin" && (
          <DropdownMenuItem
            onClick={() =>
              setRoleMutation.mutate({
                userId: user.id,
                role: "admin" as const,
              })
            }
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
            onClick={() => banUserMutation.mutate({ userId: user.id })}
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
