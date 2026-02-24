"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getPlanUpgradeButtonText,
  getPlanUpgradeLabel,
} from "@/lib/plan-limits";
import { AlertCircle } from "lucide-react";

type UpgradeNudgeProps = {
  feature: string;
  used: number;
  limit: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlan?: string;
};

export function UpgradeNudge({
  feature,
  used,
  limit,
  open,
  onOpenChange,
  currentPlan = "free",
}: UpgradeNudgeProps) {
  const buttonText = getPlanUpgradeButtonText(currentPlan);
  const planLabel = getPlanUpgradeLabel(currentPlan);
  const upgradeText =
    currentPlan === "ultra"
      ? "Limite maximale atteinte"
      : `Passe en ${planLabel} pour débloquer des limites augmentées et accéder à des fonctionnalités avancées.`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            Limite atteinte
          </DialogTitle>
          <DialogDescription className="mt-2">
            Tu as atteint la limite de {used}/{limit} {feature}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-muted-foreground text-sm">{upgradeText}</p>

          <div className="space-y-2">
            <Link href="/account/billing">
              <Button className="w-full">{buttonText}</Button>
            </Link>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => onOpenChange(false)}
            >
              Fermer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
