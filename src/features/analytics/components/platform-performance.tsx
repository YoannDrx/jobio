"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type PlatformPerformanceProps = {
  data: {
    platform: string;
    total: number;
    responded: number;
    rate: number;
  }[];
};

export function PlatformPerformance({ data }: PlatformPerformanceProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="platform" />
        <YAxis
          yAxisId="left"
          label={{ value: "Missions", angle: -90, position: "insideLeft" }}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          label={{ value: "Taux (%)", angle: 90, position: "insideRight" }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#1e293b",
            border: "1px solid #334155",
            borderRadius: "8px",
            color: "#e2e8f0",
          }}
        />
        <Bar yAxisId="left" dataKey="total" fill="#22d3ee" name="Total" />
        <Bar yAxisId="right" dataKey="rate" fill="#34d399" name="Taux %" />
      </BarChart>
    </ResponsiveContainer>
  );
}
