"use client";

import { Button } from "@/components/ui/button";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { authClient } from "@/lib/auth-client";
import { unwrapSafePromise } from "@/lib/promises";
import { useMutation } from "@tanstack/react-query";
import { Eye, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createAdminAuditAction } from "../_actions/admin-audit";

type ImpersonateUserButtonProps = {
  userId: string;
  size?: "default" | "sm";
  variant?: "default" | "outline" | "ghost";
};

export function ImpersonateUserButton({
  userId,
  size = "sm",
  variant = "outline",
}: ImpersonateUserButtonProps) {
  const router = useRouter();

  const impersonateMutation = useMutation({
    mutationFn: async () => {
      try {
        await resolveActionResult(
          createAdminAuditAction({
            action: "USER_IMPERSONATED",
            targetUserId: userId,
          }),
        );
      } catch {
        // Keep impersonation available even if audit logging fails.
      }

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
      toast.error(`Impossible d'impersonate cet utilisateur: ${error.message}`);
    },
  });

  return (
    <Button
      size={size}
      variant={variant}
      onClick={() => impersonateMutation.mutate()}
      disabled={impersonateMutation.isPending}
    >
      {impersonateMutation.isPending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Eye className="size-4" />
      )}
      Impersonate
    </Button>
  );
}
