"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MISSION_STATUS_LABELS } from "@/features/missions/mission-status";

type RevenueForecastData = {
  status: string;
  count: number;
  totalValue: number;
  probability: number;
  weightedValue: number;
};

type RevenueForecastProps = {
  data: RevenueForecastData[];
  totalPipeline: number;
  weightedPipeline: number;
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function RevenueForecast({
  data,
  totalPipeline,
  weightedPipeline,
}: RevenueForecastProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-2">
        <Card className="p-4">
          <p className="text-muted-foreground text-xs tracking-wide uppercase">
            Pipeline total
          </p>
          <p className="mt-1 text-2xl font-bold">
            {formatCurrency(totalPipeline)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-muted-foreground text-xs tracking-wide uppercase">
            Pipeline pondéré
          </p>
          <p className="mt-1 text-2xl font-bold text-brand-cyan">
            {formatCurrency(weightedPipeline)}
          </p>
        </Card>
      </div>

      <Card className="overflow-hidden">
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
                  Valeur
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
              {data.map((row) => (
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
                  <td className="px-4 py-3 text-right text-sm font-semibold text-brand-cyan">
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
