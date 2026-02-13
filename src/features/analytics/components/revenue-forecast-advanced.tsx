"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { getAdvancedRevenueForecastAction } from "@/features/analytics/actions/forecast.action";
import { MISSION_STATUS_LABELS } from "@/features/missions/mission-status";
import { TrendingUp } from "lucide-react";
import { toast } from "sonner";

type ForecastByStatus = {
  status: string;
  count: number;
  totalValue: number;
  weightedValue: number;
  probability: number;
};

type ForecastData = {
  forecast30: number;
  forecast60: number;
  forecast90: number;
  byStatus: ForecastByStatus[];
  totalWeighted: number;
  confidence: number;
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

function ConfidenceBar({ confidence }: { confidence: number }) {
  const color =
    confidence >= 70
      ? "bg-emerald-500"
      : confidence >= 40
        ? "bg-amber-500"
        : "bg-red-500";

  const label =
    confidence >= 70 ? "Haute" : confidence >= 40 ? "Moyenne" : "Faible";

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-xs">Confiance</span>
        <span className="text-xs font-medium">
          {label} ({confidence}%)
        </span>
      </div>
      <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${confidence}%` }}
        />
      </div>
    </div>
  );
}

export function RevenueForecastAdvanced() {
  const [data, setData] = useState<ForecastData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchForecast = useCallback(async () => {
    try {
      const result = await resolveActionResult(
        getAdvancedRevenueForecastAction({}),
      );
      setData(result as ForecastData);
    } catch {
      toast.error("Erreur lors du chargement des prévisions");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchForecast();
  }, [fetchForecast]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  if (!data || data.byStatus.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-muted-foreground py-8 text-center text-sm">
          Pas assez de données pour générer une prévision.
        </div>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="p-4">
          <p className="text-muted-foreground text-xs tracking-wide uppercase">
            Prévision 30 jours
          </p>
          <p className="mt-1 text-2xl font-bold text-emerald-500">
            {formatCurrency(data.forecast30)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-muted-foreground text-xs tracking-wide uppercase">
            Prévision 60 jours
          </p>
          <p className="text-brand-cyan mt-1 text-2xl font-bold">
            {formatCurrency(data.forecast60)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-muted-foreground text-xs tracking-wide uppercase">
            Prévision 90 jours
          </p>
          <p className="mt-1 text-2xl font-bold">
            {formatCurrency(data.forecast90)}
          </p>
        </Card>
      </div>

      <Card className="p-4">
        <ConfidenceBar confidence={data.confidence} />
      </Card>

      <Card className="overflow-hidden">
        <div className="flex items-center gap-2 p-4 pb-0">
          <TrendingUp className="text-brand-cyan h-4 w-4" />
          <h4 className="text-sm font-semibold">Détail par statut</h4>
          <span className="text-muted-foreground ml-auto text-xs">
            Pipeline pondéré: {formatCurrency(data.totalWeighted)}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-border bg-muted/30 border-b">
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  Statut
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold">
                  Missions
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold">
                  Valeur brute
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold">
                  Probabilité
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold">
                  Valeur pondérée
                </th>
              </tr>
            </thead>
            <tbody>
              {data.byStatus.map((row) => (
                <tr
                  key={row.status}
                  className="border-border border-b last:border-0"
                >
                  <td className="px-4 py-3">
                    <Badge variant="outline">
                      {
                        MISSION_STATUS_LABELS[
                          row.status as keyof typeof MISSION_STATUS_LABELS
                        ]
                      }
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right text-sm">{row.count}</td>
                  <td className="px-4 py-3 text-right text-sm">
                    {formatCurrency(row.totalValue)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm">
                    {row.probability}%
                  </td>
                  <td className="text-brand-cyan px-4 py-3 text-right text-sm font-semibold">
                    {formatCurrency(row.weightedValue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
