"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type ActivityGraphProps = {
  data: {
    week: string;
    missions: number;
    followUps: number;
  }[];
};

export function ActivityGraph({ data }: ActivityGraphProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="week" />
        <YAxis />
        <Tooltip
          contentStyle={{
            backgroundColor: "#1e293b",
            border: "1px solid #334155",
            borderRadius: "8px",
            color: "#e2e8f0",
          }}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="missions"
          stroke="var(--brand-cyan)"
          strokeWidth={2}
          dot={{ r: 3 }}
          name="Missions créées"
        />
        <Line
          type="monotone"
          dataKey="followUps"
          stroke="#34d399"
          strokeWidth={2}
          dot={{ r: 3 }}
          name="Follow-ups complétés"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
