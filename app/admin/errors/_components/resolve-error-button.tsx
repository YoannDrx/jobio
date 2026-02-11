"use client";

import { resolveActionResult } from "@/lib/actions/actions-utils";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { markSystemErrorResolvedAction } from "../../_actions/system-errors";

export function ResolveErrorButton({ id }: { id: string }) {
  const router = useRouter();

  const onResolve = async () => {
    try {
      await resolveActionResult(markSystemErrorResolvedAction({ id }));
      toast.success("Erreur marquée comme résolue");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Impossible de marquer l'erreur comme résolue",
      );
    }
  };

  return (
    <Button size="sm" variant="outline" onClick={() => void onResolve()}>
      <Check className="size-4" />
      Résoudre
    </Button>
  );
}
