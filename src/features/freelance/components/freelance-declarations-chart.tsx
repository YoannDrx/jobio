"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type DeclarationPeriod = {
  periodKey: string;
  invoicedCents: number;
  collectedCents: number;
  socialChargesCents: number;
};

type FreelanceDeclarationsChartProps = {
  declarations: DeclarationPeriod[];
};

const formatEuros = (value: number) =>
  `${value.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} €`;

export function FreelanceDeclarationsChart({
  declarations,
}: FreelanceDeclarationsChartProps) {
  if (declarations.length === 0) return null;

  const data = declarations.map((d) => ({
    period: d.periodKey,
    "CA Facturé": Math.round(d.invoicedCents / 100),
    "CA Encaissé": Math.round(d.collectedCents / 100),
    "Charges URSSAF": Math.round(d.socialChargesCents / 100),
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="period" tick={{ fontSize: 12 }} />
        <YAxis tickFormatter={formatEuros} tick={{ fontSize: 12 }} width={80} />
        <Tooltip
          formatter={(value) => formatEuros(Number(value))}
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
          }}
        />
        <Legend />
        <Bar dataKey="CA Facturé" fill="#60a5fa" radius={[4, 4, 0, 0]} />
        <Bar dataKey="CA Encaissé" fill="#34d399" radius={[4, 4, 0, 0]} />
        <Bar dataKey="Charges URSSAF" fill="#f87171" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
