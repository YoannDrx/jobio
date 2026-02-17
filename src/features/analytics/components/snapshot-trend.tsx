"use client";

import type { SnapshotData } from "@/features/analytics/analytics-snapshot";

type SnapshotEntry = {
  date: string | Date;
  data: SnapshotData;
};

type SnapshotTrendProps = {
  snapshots: SnapshotEntry[];
  metric?: keyof Pick<
    SnapshotData,
    "totalMissions" | "conversionRate" | "pipelineHealthScore"
  >;
  height?: number;
  width?: number;
  color?: string;
};

function Sparkline({
  values,
  height,
  width,
  color,
}: {
  values: number[];
  height: number;
  width: number;
  color: string;
}) {
  if (values.length < 2) {
    return (
      <div
        className="text-muted-foreground flex items-center justify-center text-xs"
        style={{ height, width }}
      >
        Pas assez de donnees
      </div>
    );
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const padding = 2;
  const chartHeight = height - padding * 2;
  const chartWidth = width - padding * 2;

  const points = values
    .map((value, index) => {
      const x = padding + (index / (values.length - 1)) * chartWidth;
      const y = padding + chartHeight - ((value - min) / range) * chartHeight;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="overflow-visible"
    >
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SnapshotTrend({
  snapshots,
  metric = "totalMissions",
  height = 40,
  width = 120,
  color = "currentColor",
}: SnapshotTrendProps) {
  const sorted = [...snapshots].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  const values = sorted.map((s) => s.data[metric]);

  const current = values[values.length - 1];
  const previous = values.length >= 2 ? values[values.length - 2] : undefined;
  const delta =
    previous !== undefined && previous > 0
      ? Math.round(((current - previous) / previous) * 100)
      : undefined;

  return (
    <div className="flex items-center gap-3">
      <Sparkline values={values} height={height} width={width} color={color} />
      {delta !== undefined && (
        <span
          className={`text-xs font-semibold ${delta >= 0 ? "text-emerald-500" : "text-red-500"}`}
        >
          {delta > 0 ? "+" : ""}
          {delta}%
        </span>
      )}
    </div>
  );
}
