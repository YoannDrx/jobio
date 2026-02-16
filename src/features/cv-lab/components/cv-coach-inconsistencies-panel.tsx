"use client";

import { AlertTriangle, CheckCircle2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { CvCoachInconsistency } from "../cv-coach.schema";

type CvCoachInconsistenciesPanelProps = {
  inconsistencies: CvCoachInconsistency[];
  onApplySuggestion?: (inconsistency: CvCoachInconsistency) => void;
};

const severityConfig = {
  CRITICAL: {
    border: "border-l-red-500",
    badge: "destructive" as const,
    label: "Critique",
  },
  MAJOR: {
    border: "border-l-orange-500",
    badge: "outline" as const,
    label: "Majeure",
  },
  MINOR: {
    border: "border-l-muted-foreground",
    badge: "secondary" as const,
    label: "Mineure",
  },
};

const severityOrder = { CRITICAL: 0, MAJOR: 1, MINOR: 2 };

export function CvCoachInconsistenciesPanel({
  inconsistencies,
  onApplySuggestion,
}: CvCoachInconsistenciesPanelProps) {
  if (inconsistencies.length === 0) {
    return (
      <p className="text-muted-foreground py-2 text-sm">
        Aucune incohérence détectée.
      </p>
    );
  }

  const sorted = [...inconsistencies].sort(
    (a, b) => severityOrder[a.severity] - severityOrder[b.severity],
  );

  return (
    <div className="flex flex-col gap-2">
      {sorted.map((item) => {
        const config = severityConfig[item.severity];
        return (
          <div
            key={item.id}
            className={cn(
              "flex flex-col gap-1.5 rounded-md border border-l-4 p-3",
              config.border,
            )}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-3.5 shrink-0" />
              <span className="text-sm font-medium">{item.description}</span>
              <Badge variant={config.badge} className="ml-auto text-[10px]">
                {config.label}
              </Badge>
            </div>
            <p className="text-muted-foreground text-xs italic">
              {item.suggestion}
            </p>
            {onApplySuggestion ? (
              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => onApplySuggestion(item)}
                >
                  <CheckCircle2 className="size-3" />
                  Appliquer
                </Button>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
