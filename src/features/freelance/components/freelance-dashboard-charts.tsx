"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type RevenuePoint = {
  key: string;
  label: string;
  invoicedCents: number;
  collectedCents: number;
  outstandingCents: number;
};

type StatusPoint = {
  status: string;
  count: number;
};

type TopClientPoint = {
  clientLabel: string;
  invoicedCents: number;
  outstandingCents: number;
};

type DeclarationPoint = {
  periodKey: string;
  invoicedCents: number;
  collectedCents: number;
  socialChargesCents: number;
};

type FreelanceDashboardChartsProps = {
  charts?: {
    revenueTimeline: RevenuePoint[];
    statusBreakdown: StatusPoint[];
    topClients: TopClientPoint[];
    declarationBreakdown: DeclarationPoint[];
  } | null;
};

const INVOICE_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Brouillon",
  ISSUED: "Émise",
  PARTIALLY_PAID: "Partiellement payée",
  PAID: "Payée",
  OVERDUE: "En retard",
  CANCELLED: "Annulée",
};

const PIE_COLORS = [
  "#94a3b8",
  "#38bdf8",
  "#60a5fa",
  "#34d399",
  "#f97316",
  "#f43f5e",
] as const;

const formatCents = (value: number) => {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value / 100);
};

const formatCompactCents = (value: number) => {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value / 100);
};

export function FreelanceDashboardCharts({
  charts,
}: FreelanceDashboardChartsProps) {
  if (!charts) {
    return null;
  }

  const statusData = charts.statusBreakdown
    .filter((item) => item.count > 0)
    .map((item) => ({
      ...item,
      label: INVOICE_STATUS_LABELS[item.status] ?? item.status,
    }));

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Évolution CA (12 mois)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart
              data={charts.revenueTimeline}
              margin={{ left: 0, right: 16, top: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis tickFormatter={formatCompactCents} width={80} />
              <Tooltip
                formatter={(value) => formatCents(Number(value))}
                labelFormatter={(label) => `Mois: ${label}`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="invoicedCents"
                stroke="#06b6d4"
                strokeWidth={2.2}
                dot={false}
                name="Facturé"
              />
              <Line
                type="monotone"
                dataKey="collectedCents"
                stroke="#0ea5e9"
                strokeWidth={2.2}
                dot={false}
                name="Encaissé"
              />
              <Line
                type="monotone"
                dataKey="outstandingCents"
                stroke="#f97316"
                strokeWidth={2}
                dot={false}
                name="Encours"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Répartition des statuts facture</CardTitle>
        </CardHeader>
        <CardContent>
          {statusData.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Pas encore de données facture.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="count"
                  nameKey="label"
                  innerRadius={52}
                  outerRadius={95}
                  paddingAngle={2}
                >
                  {statusData.map((entry, index) => (
                    <Cell
                      key={`${entry.status}-${index}`}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top clients facturés</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={charts.topClients}
              margin={{ left: 0, right: 16, top: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="clientLabel"
                tick={{ fontSize: 11 }}
                interval={0}
                angle={-14}
                textAnchor="end"
                height={60}
              />
              <YAxis tickFormatter={formatCompactCents} width={80} />
              <Tooltip formatter={(value) => formatCents(Number(value))} />
              <Legend />
              <Bar
                dataKey="invoicedCents"
                fill="#06b6d4"
                name="Facturé"
                radius={[6, 6, 0, 0]}
              />
              <Bar
                dataKey="outstandingCents"
                fill="#fb923c"
                name="Encours"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>URSSAF: périodes ouvertes</CardTitle>
        </CardHeader>
        <CardContent>
          {charts.declarationBreakdown.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Aucune période déclarative en cours.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={charts.declarationBreakdown}
                margin={{ left: 0, right: 16, top: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="periodKey" />
                <YAxis tickFormatter={formatCompactCents} width={80} />
                <Tooltip formatter={(value) => formatCents(Number(value))} />
                <Legend />
                <Bar
                  dataKey="invoicedCents"
                  fill="#22c55e"
                  name="Facturé"
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  dataKey="socialChargesCents"
                  fill="#f59e0b"
                  name="Charges estimées"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
