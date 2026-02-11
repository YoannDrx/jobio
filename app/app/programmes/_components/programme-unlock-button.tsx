"use client";

import { Button } from "@/components/ui/button";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import {
  createProgramCheckoutAction,
  unlockFreeProgramAction,
} from "@/features/programmes/programmes.action";
import { Loader2, Lock, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type ProgrammeUnlockButtonProps = {
  programId: string;
  programSlug: string;
  isFree: boolean;
  price: number;
};

export function ProgrammeUnlockButton({
  programId,
  programSlug,
  isFree,
  price,
}: ProgrammeUnlockButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleUnlock = async () => {
    setIsLoading(true);
    try {
      if (isFree) {
        await resolveActionResult(unlockFreeProgramAction({ programId }));
        toast.success("Programme débloqué !");
        router.refresh();
      } else {
        const result = await resolveActionResult(
          createProgramCheckoutAction({
            programId,
            successUrl: `/app/programmes/${programSlug}`,
            cancelUrl: `/app/programmes/${programSlug}`,
          }),
        );
        window.location.href = result.url;
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Une erreur est survenue",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      size="lg"
      onClick={() => void handleUnlock()}
      disabled={isLoading}
      className="gap-2"
    >
      {isLoading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : isFree ? (
        <Sparkles className="size-4" />
      ) : (
        <Lock className="size-4" />
      )}
      {isFree
        ? "Débloquer gratuitement"
        : `Débloquer pour ${(price / 100).toFixed(0)}€`}
    </Button>
  );
}
