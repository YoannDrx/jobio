"use client";

import { syncSeoMetricsNowAction } from "@app/admin/_actions/seo";
import { Button } from "@/components/ui/button";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

export function SyncSeoMetricsButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const onSync = () => {
    startTransition(() => {
      void resolveActionResult(syncSeoMetricsNowAction({}))
        .then((result) => {
          const typedResult = result as {
            provider: string;
            capturedAt: string;
          };
          toast.success(
            `Métriques SEO synchronisées (${typedResult.provider}) - snapshot ${typedResult.capturedAt}`,
          );
          router.refresh();
        })
        .catch((error) => {
          toast.error(
            error instanceof Error
              ? error.message
              : "Impossible de synchroniser les métriques SEO",
          );
        });
    });
  };

  return (
    <Button size="sm" variant="outline" disabled={isPending} onClick={onSync}>
      Synchroniser SEO
    </Button>
  );
}
