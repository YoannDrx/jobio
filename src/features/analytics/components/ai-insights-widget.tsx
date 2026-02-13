"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { getAIInsightsAction } from "@/features/analytics/ai-insights.action";
import type {
  Insight,
  InsightSeverity,
} from "@/features/analytics/ai-insights";
import {
  AlertTriangle,
  AlertCircle,
  Info,
  Lightbulb,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const SEVERITY_CONFIG: Record<
  InsightSeverity,
  { icon: typeof AlertTriangle; color: string }
> = {
  critical: { icon: AlertTriangle, color: "text-red-500" },
  warning: { icon: AlertCircle, color: "text-amber-500" },
  info: { icon: Info, color: "text-blue-500" },
};

export function AIInsightsWidget() {
  const [insights, setInsights] = useState<Insight[] | null>(null);

  useEffect(() => {
    void resolveActionResult(getAIInsightsAction()).then(setInsights);
  }, []);

  if (!insights) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Lightbulb className="size-4" />
          Insights
        </CardTitle>
      </CardHeader>
      <CardContent>
        {insights.length === 0 ? (
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <CheckCircle className="size-4" />
            <span className="text-sm">Tout va bien !</span>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {insights.map((insight) => {
              const config = SEVERITY_CONFIG[insight.severity];
              const Icon = config.icon;

              const content = (
                <div className="hover:bg-muted flex items-start gap-3 rounded-lg border p-3 transition-colors">
                  <Icon className={`mt-0.5 size-4 shrink-0 ${config.color}`} />
                  <p className="text-sm">{insight.message}</p>
                </div>
              );

              if (insight.link) {
                return (
                  <Link key={insight.type} href={insight.link}>
                    {content}
                  </Link>
                );
              }

              return <div key={insight.type}>{content}</div>;
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
