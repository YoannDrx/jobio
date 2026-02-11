"use client";

import { Button } from "@/components/ui/button";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { updateFeatureFlagAction } from "@app/admin/_actions/ops";

type FeatureFlagToggleButtonProps = {
  flagKey: string;
  enabled: boolean;
};

export function FeatureFlagToggleButton({
  flagKey,
  enabled,
}: FeatureFlagToggleButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const onToggle = () => {
    startTransition(() => {
      void resolveActionResult(
        updateFeatureFlagAction({
          key: flagKey,
          enabled: !enabled,
        }),
      )
        .then(() => {
          toast.success("Feature flag mis à jour");
          router.refresh();
        })
        .catch((error) => {
          toast.error(
            error instanceof Error
              ? error.message
              : "Impossible de mettre à jour ce feature flag",
          );
        });
    });
  };

  return (
    <Button
      size="sm"
      variant={enabled ? "default" : "outline"}
      disabled={isPending}
      onClick={onToggle}
    >
      {enabled ? "Activé" : "Désactivé"}
    </Button>
  );
}
