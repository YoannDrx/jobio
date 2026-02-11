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

type TJMComparisonProps = {
  data: {
    status: string;
    avgTjm: number;
    label: string;
  }[];
};

export function TJMComparison({ data }: TJMComparisonProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="label" />
        <YAxis
          label={{ value: "TJM (€)", angle: -90, position: "insideLeft" }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#1e293b",
            border: "1px solid #334155",
            borderRadius: "8px",
            color: "#e2e8f0",
          }}
        />
        <Legend />
        <Bar dataKey="avgTjm" fill="var(--brand-cyan)" name="TJM moyen" />
      </BarChart>
    </ResponsiveContainer>
  );
}
