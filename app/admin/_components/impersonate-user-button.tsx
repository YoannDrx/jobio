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
  userEmail?: string;
  size?: "default" | "sm";
  variant?: "default" | "outline" | "ghost";
};

export function ImpersonateUserButton({
  userId,
  userEmail,
  size = "sm",
  variant = "outline",
}: ImpersonateUserButtonProps) {
  const router = useRouter();

  const askReason = () => {
    const reason = window.prompt(
      'Raison obligatoire pour "Impersonate" (min 6 caractères)',
    );
    if (!reason || reason.trim().length < 6) {
      throw new Error("Raison obligatoire (6 caractères minimum)");
    }

    const confirmed =
      window.prompt(
        "Action sensible: Impersonate utilisateur\nTape CONFIRMER pour continuer.",
      ) === "CONFIRMER";

    if (!confirmed) {
      throw new Error("Impersonation annulée");
    }

    return reason.trim();
  };

  const impersonateMutation = useMutation({
    mutationFn: async () => {
      const reason = askReason();

      try {
        await resolveActionResult(
          createAdminAuditAction({
            action: "USER_IMPERSONATED",
            targetUserId: userId,
            targetEmail: userEmail,
            metadata: {
              reason,
            },
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
      router.push("/job");
    },
    onError: (error: Error) => {
      if (error.message === "Impersonation annulée") {
        return;
      }
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
