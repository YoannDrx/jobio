"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { generateFreelanceBillingForecastAction } from "@/features/freelance/billing-ai-forecast.action";
import { formatCents } from "@/features/freelance/billing-presenter";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type ForecastResult = {
  generatedAt: string;
  metrics: {
    invoicedLast90Cents: number;
    collectedLast90Cents: number;
    outstandingCents: number;
    quotesToValidate: number;
    overdueCount: number;
    collectionRate: number;
  };
  monthlySeries: {
    key: string;
    label: string;
    invoicedCents: number;
    collectedCents: number;
  }[];
  forecast: {
    summary: string;
    forecastInvoicedEur: number;
    forecastCollectedEur: number;
    confidence: "low" | "medium" | "high";
    risks: string[];
    recommendations: string[];
  };
};

const formatEur = (value: number) => {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const confidenceLabel = {
  low: "Confiance faible",
  medium: "Confiance moyenne",
  high: "Confiance élevée",
} as const;

const confidenceVariant = {
  low: "destructive",
  medium: "secondary",
  high: "default",
} as const;

export function FreelanceAiForecastPanel() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ForecastResult | null>(null);

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const nextResult = await resolveActionResult(
        generateFreelanceBillingForecastAction({}),
      );
      setResult(nextResult as ForecastResult);
      toast.success("Projection générée");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Impossible de générer la projection",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="size-4" />
          Copilote IA prévisionnel
        </CardTitle>
        <Button type="button" onClick={handleGenerate} disabled={isLoading}>
          {isLoading ? <Loader2 className="size-4 animate-spin" /> : null}
          Générer une projection
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {!result ? (
          <p className="text-muted-foreground text-sm">
            Génére une projection pour estimer ton CA et ton encaissement des 90
            prochains jours, avec des actions recommandées.
          </p>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm">{result.forecast.summary}</p>
              <Badge variant={confidenceVariant[result.forecast.confidence]}>
                {confidenceLabel[result.forecast.confidence]}
              </Badge>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-md border p-3">
                <p className="text-muted-foreground text-xs">
                  Projection CA facturé (90j)
                </p>
                <p className="text-lg font-semibold">
                  {formatEur(result.forecast.forecastInvoicedEur)}
                </p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-muted-foreground text-xs">
                  Projection encaissement (90j)
                </p>
                <p className="text-lg font-semibold">
                  {formatEur(result.forecast.forecastCollectedEur)}
                </p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-md border p-3">
                <p className="text-muted-foreground text-xs">Facturé 90j</p>
                <p className="font-semibold">
                  {formatCents(result.metrics.invoicedLast90Cents)}
                </p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-muted-foreground text-xs">Encaissé 90j</p>
                <p className="font-semibold">
                  {formatCents(result.metrics.collectedLast90Cents)}
                </p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-muted-foreground text-xs">Encours</p>
                <p className="font-semibold">
                  {formatCents(result.metrics.outstandingCents)}
                </p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-md border p-3">
                <p className="text-sm font-medium">Actions recommandées</p>
                <ul className="mt-2 list-disc space-y-1 pl-4 text-sm">
                  {result.forecast.recommendations.map((recommendation) => (
                    <li key={recommendation}>{recommendation}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-sm font-medium">Risques à surveiller</p>
                <ul className="mt-2 list-disc space-y-1 pl-4 text-sm">
                  {result.forecast.risks.map((risk) => (
                    <li key={risk}>{risk}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="rounded-md border p-3">
              <p className="text-sm font-medium">Tendance 6 derniers mois</p>
              <div className="mt-2 grid gap-2 text-sm">
                {result.monthlySeries.map((month) => (
                  <div
                    key={month.key}
                    className="grid grid-cols-[80px_1fr_1fr] items-center gap-3"
                  >
                    <span className="text-muted-foreground">{month.label}</span>
                    <span>Facturé {formatCents(month.invoicedCents)}</span>
                    <span>Encaissé {formatCents(month.collectedCents)}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
