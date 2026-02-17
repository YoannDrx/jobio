"use client";

import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import { runQualityChecks } from "../cv-coach-quality-checks";
import type { CvCoachSnapshot } from "../cv-coach.schema";

type CvCoachQualityChecksPanelProps = {
  snapshot: CvCoachSnapshot;
  goalRole?: string;
};

const statusConfig = {
  pass: {
    icon: CheckCircle2,
    textColor: "text-emerald-600",
    badge: "secondary" as const,
    label: "Passé",
  },
  warn: {
    icon: AlertTriangle,
    textColor: "text-amber-600",
    badge: "outline" as const,
    label: "Attention",
  },
  fail: {
    icon: XCircle,
    textColor: "text-rose-600",
    badge: "destructive" as const,
    label: "Échoué",
  },
};

export function CvCoachQualityChecksPanel({
  snapshot,
  goalRole,
}: CvCoachQualityChecksPanelProps) {
  const results = runQualityChecks(snapshot, goalRole);

  const passedCount = results.filter((r) => r.status === "pass").length;
  const totalCount = results.length;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-muted-foreground text-sm font-medium">
        {passedCount}/{totalCount} checks passés
      </p>

      <div className="flex flex-col gap-2">
        {results.map((result) => {
          const config = statusConfig[result.status];
          const Icon = config.icon;

          return (
            <div
              key={result.id}
              className={cn(
                "flex flex-col gap-1.5 rounded-md border p-3",
                result.status === "pass" ? "border-emerald-200" : "",
                result.status === "warn" ? "border-amber-200" : "",
                result.status === "fail" ? "border-rose-200" : "",
              )}
            >
              <div className="flex items-center gap-2">
                <Icon className={cn("size-4", config.textColor)} />
                <span className="text-sm font-medium">{result.label}</span>
                <Badge variant={config.badge} className="text-[10px]">
                  {config.label}
                </Badge>
              </div>
              <p className="text-muted-foreground text-xs">{result.message}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
