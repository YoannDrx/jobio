"use client";

import { Card } from "@/components/ui/card";
import { TrendingUp, Euro, Briefcase, Calendar } from "lucide-react";

type EarningsData = {
  totalAccepted: number;
  avgTjm: number;
  totalEstimatedRevenue: number;
  monthlyProjection: number;
};

type EarningsDashboardProps = {
  data: EarningsData;
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function EarningsDashboard({ data }: EarningsDashboardProps) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      <Card className="p-4">
        <div className="flex items-center gap-2">
          <Briefcase className="size-4 text-emerald-400" />
          <p className="text-muted-foreground text-xs tracking-wide uppercase">
            Missions acceptées
          </p>
        </div>
        <p className="mt-1 text-2xl font-bold">{data.totalAccepted}</p>
      </Card>
      <Card className="p-4">
        <div className="flex items-center gap-2">
          <Euro className="text-brand-cyan size-4" />
          <p className="text-muted-foreground text-xs tracking-wide uppercase">
            TJM moyen accepté
          </p>
        </div>
        <p className="mt-1 text-2xl font-bold">
          {formatCurrency(data.avgTjm)}/j
        </p>
      </Card>
      <Card className="p-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="size-4 text-emerald-400" />
          <p className="text-muted-foreground text-xs tracking-wide uppercase">
            Revenus estimés
          </p>
        </div>
        <p className="mt-1 text-2xl font-bold text-emerald-400">
          {formatCurrency(data.totalEstimatedRevenue)}
        </p>
      </Card>
      <Card className="p-4">
        <div className="flex items-center gap-2">
          <Calendar className="text-brand-cyan size-4" />
          <p className="text-muted-foreground text-xs tracking-wide uppercase">
            Projection mensuelle
          </p>
        </div>
        <p className="text-brand-cyan mt-1 text-2xl font-bold">
          {formatCurrency(data.monthlyProjection)}/mois
        </p>
      </Card>
    </div>
  );
}
