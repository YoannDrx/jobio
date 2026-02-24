"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  getPlanLimitMessage,
  getPlanUpgradeButtonText,
} from "@/lib/plan-limits";
import { AlertTriangle, XCircle } from "lucide-react";
import Link from "next/link";

type PlanLimitBannerProps = {
  used: number;
  limit: number;
  remaining: number;
  featureLabel: string;
  currentPlan?: string;
};

export function PlanLimitBanner({
  used,
  limit,
  remaining,
  featureLabel,
  currentPlan = "free",
}: PlanLimitBannerProps) {
  if (remaining > 3 || limit >= 999999) return null;

  const isExhausted = remaining === 0;
  const upgradeMessage = getPlanLimitMessage(currentPlan, isExhausted);
  const buttonText = getPlanUpgradeButtonText(currentPlan);

  return (
    <Alert
      variant={isExhausted ? "destructive" : "default"}
      className="flex items-center justify-between"
    >
      <div className="flex items-center gap-2">
        {isExhausted ? (
          <XCircle className="size-4" />
        ) : (
          <AlertTriangle className="size-4" />
        )}
        <AlertDescription>
          {isExhausted
            ? `Limite atteinte : ${used}/${limit} ${featureLabel}. ${upgradeMessage}`
            : `Il te reste ${remaining} ${featureLabel} sur ${limit}. ${upgradeMessage}`}
        </AlertDescription>
      </div>
      <Button
        size="sm"
        variant={isExhausted ? "destructive" : "outline"}
        asChild
      >
        <Link href="/account/billing">{buttonText}</Link>
      </Button>
    </Alert>
  );
}
