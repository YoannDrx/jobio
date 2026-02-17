"use client";

import { Button } from "@/components/ui/button";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { syncDefaultFeatureFlagsAction } from "@app/admin/_actions/ops";

export function SyncFeatureFlagsButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const onSync = () => {
    startTransition(() => {
      void resolveActionResult(syncDefaultFeatureFlagsAction({}))
        .then((result) => {
          const typedResult = result as { total: number };
          toast.success(`${typedResult.total} feature flags synchronisés`);
          router.refresh();
        })
        .catch((error) => {
          toast.error(
            error instanceof Error
              ? error.message
              : "Impossible de synchroniser les feature flags",
          );
        });
    });
  };

  return (
    <Button size="sm" variant="outline" disabled={isPending} onClick={onSync}>
      Synchroniser les flags
    </Button>
  );
}
