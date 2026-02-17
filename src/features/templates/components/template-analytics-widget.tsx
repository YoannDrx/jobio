"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { getTemplateAnalyticsAction } from "@/features/templates/template-analytics.action";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

type TemplateAnalytics = {
  topTemplates: {
    templateId: string;
    name: string;
    type: string | null;
    count: number;
    lastUsedAt: Date | null;
  }[];
  monthlyTotal: number;
};

export function TemplateAnalyticsWidget() {
  const [data, setData] = useState<TemplateAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    resolveActionResult(getTemplateAnalyticsAction())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="text-muted-foreground size-5 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  const maxCount = Math.max(...data.topTemplates.map((t) => t.count), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Templates les plus utilises</CardTitle>
        <CardDescription>
          {data.monthlyTotal} utilisation{data.monthlyTotal > 1 ? "s" : ""} ce
          mois
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {data.topTemplates.length === 0 && (
          <p className="text-muted-foreground text-sm">
            Aucune utilisation de template pour le moment
          </p>
        )}
        {data.topTemplates.map((template) => (
          <div key={template.templateId} className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-sm">
              <span className="truncate">{template.name}</span>
              <span className="text-muted-foreground ml-2 shrink-0 font-mono text-xs">
                {template.count}x
              </span>
            </div>
            <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
              <div
                className="bg-primary h-full rounded-full transition-all"
                style={{
                  width: `${(template.count / maxCount) * 100}%`,
                }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
