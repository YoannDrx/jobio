"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { BillingDeclarationPeriodType } from "@/generated/prisma";
import { getBillingProfileAction } from "@/features/freelance/billing-clients.action";
import { rebuildBillingDeclarationPeriodsAction } from "@/features/freelance/billing-documents.action";
import {
  resolveBillingCompliancePreset,
  type BillingCompliancePreset,
} from "@/features/freelance/billing-compliance-rules";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { Loader2, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const formatRate = (value: number) => {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
};

const DECLARATION_PERIOD = {
  monthly: "MONTHLY",
  quarterly: "QUARTERLY",
} as const satisfies Record<string, BillingDeclarationPeriodType>;

export function FreelanceDeclarationsBuilder() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [rate, setRate] = useState("23.1");
  const [type, setType] = useState<BillingDeclarationPeriodType>(
    DECLARATION_PERIOD.quarterly,
  );
  const [preset, setPreset] = useState<BillingCompliancePreset | null>(null);

  useEffect(() => {
    const loadPreset = async () => {
      try {
        const profile = await resolveActionResult(getBillingProfileAction({}));
        const nextPreset = resolveBillingCompliancePreset({
          freelanceStatus: profile?.freelanceStatus ?? null,
          activityCategory: profile?.activityCategory ?? null,
        });

        setPreset(nextPreset);
        setType(
          profile?.urssafDeclarationType ?? nextPreset.defaultDeclarationType,
        );
        setRate(
          formatRate(
            profile?.urssafContributionRate ??
              nextPreset.defaultContributionRatePercent,
          ),
        );
      } catch {
        const fallback = resolveBillingCompliancePreset({});
        setPreset(fallback);
      } finally {
        setIsBootstrapping(false);
      }
    };

    void loadPreset();
  }, []);

  const applyPreset = () => {
    if (!preset) {
      return;
    }

    setType(preset.defaultDeclarationType);
    setRate(formatRate(preset.defaultContributionRatePercent));
    toast.success("Paramètres URSSAF recommandés appliqués");
  };

  const handleRebuild = async () => {
    const nextYear = Number(year);
    const nextRate = Number(rate);

    if (!Number.isFinite(nextYear) || nextYear < 2020 || nextYear > 2100) {
      toast.error("Année invalide");
      return;
    }

    if (!Number.isFinite(nextRate) || nextRate < 0 || nextRate > 100) {
      toast.error("Taux de cotisation invalide");
      return;
    }

    setIsLoading(true);
    try {
      const result = await resolveActionResult(
        rebuildBillingDeclarationPeriodsAction({
          year: nextYear,
          type,
          contributionRatePercent: nextRate,
        }),
      );

      toast.success(`${result.periods.length} période(s) recalculée(s)`);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Recalcul impossible",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs">Type de période</p>
          <Select
            value={type}
            onValueChange={(value) => {
              setType(value as BillingDeclarationPeriodType);
            }}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={DECLARATION_PERIOD.monthly}>
                Mensuel
              </SelectItem>
              <SelectItem value={DECLARATION_PERIOD.quarterly}>
                Trimestriel
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs">Année</p>
          <Input
            className="w-32"
            value={year}
            onChange={(event) => {
              setYear(event.target.value);
            }}
          />
        </div>
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs">Taux URSSAF (%)</p>
          <Input
            className="w-32"
            value={rate}
            onChange={(event) => {
              setRate(event.target.value);
            }}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={isBootstrapping || isLoading || !preset}
          onClick={applyPreset}
        >
          Appliquer le preset
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={isLoading || isBootstrapping}
          onClick={handleRebuild}
        >
          {isLoading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <RefreshCw className="size-4" />
          )}
          Recalculer les périodes
        </Button>
      </div>
      {preset ? (
        <div className="text-muted-foreground text-xs">
          Preset actif: {preset.statusLabel}. {preset.notes.at(0)}
        </div>
      ) : null}
    </div>
  );
}
