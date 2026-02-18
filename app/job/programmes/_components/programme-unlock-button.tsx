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
  className?: string;
};

export function ProgrammeUnlockButton({
  programId,
  programSlug,
  isFree,
  price,
  className,
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
            successUrl: `/job/programmes/${programSlug}`,
            cancelUrl: `/job/programmes/${programSlug}`,
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
      className={`gap-2 px-8 text-base shadow-lg transition-all hover:shadow-xl ${className ?? ""}`}
    >
      {isLoading ? (
        <Loader2 className="size-5 animate-spin" />
      ) : isFree ? (
        <Sparkles className="size-5" />
      ) : (
        <Lock className="size-5" />
      )}
      {isFree
        ? "Débloquer gratuitement"
        : `Débloquer pour ${(price / 100).toFixed(0)}€`}
    </Button>
  );
}
