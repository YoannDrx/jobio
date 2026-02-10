"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

type FunnelChartProps = {
  data: {
    status: string;
    count: number;
    label: string;
  }[];
};

const FUNNEL_COLORS: Record<string, string> = {
  A_POSTULER: "#94a3b8",
  POSTULE: "#60a5fa",
  ENTRETIEN: "#22d3ee",
  PROPOSITION: "#34d399",
  ACCEPTE: "#4ade80",
  REFUSE: "#f87171",
  ARCHIVE: "#6b7280",
};

export function FunnelChart({ data }: FunnelChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 5, right: 30, left: 200, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" />
        <YAxis dataKey="label" type="category" width={190} />
        <Tooltip
          contentStyle={{
            backgroundColor: "#1e293b",
            border: "1px solid #334155",
            borderRadius: "8px",
            color: "#e2e8f0",
          }}
        />
        <Bar dataKey="count">
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={FUNNEL_COLORS[entry.status] ?? "#3b82f6"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
