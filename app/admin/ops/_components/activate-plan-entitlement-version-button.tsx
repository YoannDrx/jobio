"use client";

import { activatePlanEntitlementVersionAction } from "@app/admin/_actions/pricing";
import { Button } from "@/components/ui/button";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

type ActivatePlanEntitlementVersionButtonProps = {
  plan: "free" | "pro" | "ultra";
  version: number;
  isActive: boolean;
};

export function ActivatePlanEntitlementVersionButton({
  plan,
  version,
  isActive,
}: ActivatePlanEntitlementVersionButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const onActivate = () => {
    startTransition(() => {
      void resolveActionResult(
        activatePlanEntitlementVersionAction({
          plan,
          version,
        }),
      )
        .then(() => {
          toast.success(`Version ${version} activée pour ${plan}.`);
          router.refresh();
        })
        .catch((error) => {
          toast.error(
            error instanceof Error
              ? error.message
              : "Impossible d'activer cette version",
          );
        });
    });
  };

  return (
    <Button
      size="sm"
      variant={isActive ? "default" : "outline"}
      disabled={isPending || isActive}
      onClick={onActivate}
    >
      {isActive ? `v${version} active` : `Activer v${version}`}
    </Button>
  );
}
