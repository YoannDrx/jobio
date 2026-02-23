"use client";

import { createPlanEntitlementVersionAction } from "@app/admin/_actions/pricing";
import { Button } from "@/components/ui/button";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

type CreatePlanEntitlementVersionButtonProps = {
  plan: "free" | "pro" | "ultra";
  source: "active" | "static";
};

export function CreatePlanEntitlementVersionButton({
  plan,
  source,
}: CreatePlanEntitlementVersionButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const onCreate = () => {
    startTransition(() => {
      void resolveActionResult(
        createPlanEntitlementVersionAction({
          plan,
          source,
          activate: false,
        }),
      )
        .then((result) => {
          const typedResult = result as { nextVersion: number; plan: string };
          toast.success(
            `Version ${typedResult.nextVersion} créée pour ${typedResult.plan}.`,
          );
          router.refresh();
        })
        .catch((error) => {
          toast.error(
            error instanceof Error
              ? error.message
              : "Impossible de créer la version d'entitlements",
          );
        });
    });
  };

  return (
    <Button size="sm" variant="outline" disabled={isPending} onClick={onCreate}>
      {source === "active" ? "Cloner active" : "Cloner statique"}
    </Button>
  );
}
