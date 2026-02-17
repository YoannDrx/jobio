"use client";

import { Card } from "@/components/ui/card";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { getPipelineHealthAction } from "@/features/analytics/pipeline-health.action";
import { Activity } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type Metric = {
  label: string;
  score: number;
  maxScore: number;
};

type HealthData = {
  score: number;
  metrics: Metric[];
};

function getScoreColor(score: number): string {
  if (score >= 80) return "text-emerald-500";
  if (score >= 50) return "text-yellow-500";
  return "text-red-500";
}

function getBarColor(score: number, maxScore: number): string {
  const ratio = score / maxScore;
  if (ratio >= 0.8) return "bg-emerald-500";
  if (ratio >= 0.5) return "bg-yellow-500";
  return "bg-red-500";
}

export function PipelineHealthWidget() {
  const [data, setData] = useState<HealthData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const result = await resolveActionResult(getPipelineHealthAction());
        setData(result);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Erreur lors du chargement",
        );
      } finally {
        setIsLoading(false);
      }
    };

    void fetchHealth();
  }, []);

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex animate-pulse flex-col gap-4">
          <div className="bg-muted h-4 w-32 rounded" />
          <div className="bg-muted h-12 w-16 rounded" />
          <div className="flex flex-col gap-2">
            <div className="bg-muted h-3 w-full rounded" />
            <div className="bg-muted h-3 w-full rounded" />
            <div className="bg-muted h-3 w-full rounded" />
            <div className="bg-muted h-3 w-full rounded" />
          </div>
        </div>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center gap-2">
        <Activity className="text-brand-cyan size-5" />
        <h3 className="font-semibold">Sante du pipeline</h3>
      </div>

      <div className="mb-6 text-center">
        <p className={`text-5xl font-bold ${getScoreColor(data.score)}`}>
          {data.score}
        </p>
        <p className="text-muted-foreground mt-1 text-sm">/ 100</p>
      </div>

      <div className="flex flex-col gap-3">
        {data.metrics.map((metric) => (
          <div key={metric.label} className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs">
                {metric.label}
              </span>
              <span className="text-xs font-medium">
                {metric.score}/{metric.maxScore}
              </span>
            </div>
            <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
              <div
                className={`h-full rounded-full transition-all ${getBarColor(metric.score, metric.maxScore)}`}
                style={{
                  width: `${(metric.score / metric.maxScore) * 100}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
