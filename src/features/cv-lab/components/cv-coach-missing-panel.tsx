"use client";

import { MessageCircleQuestion } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import type { CvCoachMissingItem } from "../cv-coach.schema";

type CvCoachMissingPanelProps = {
  missingItems: CvCoachMissingItem[];
  onAskQuestion: (question: string) => void;
};

const priorityConfig = {
  HIGH: {
    border: "border-l-red-500",
    badge: "destructive" as const,
    label: "Haute",
  },
  MEDIUM: {
    border: "border-l-orange-500",
    badge: "outline" as const,
    label: "Moyenne",
  },
  LOW: {
    border: "border-l-muted-foreground",
    badge: "secondary" as const,
    label: "Basse",
  },
};

const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };

export function CvCoachMissingPanel({
  missingItems,
  onAskQuestion,
}: CvCoachMissingPanelProps) {
  if (missingItems.length === 0) {
    return (
      <p className="text-muted-foreground py-2 text-sm">
        Aucun manque détecté.
      </p>
    );
  }

  const sorted = [...missingItems].sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority],
  );

  return (
    <div className="flex flex-col gap-2">
      {sorted.map((item) => {
        const config = priorityConfig[item.priority];
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onAskQuestion(item.question)}
            className={cn(
              "hover:bg-muted/50 flex flex-col gap-1.5 rounded-md border border-l-4 p-3 text-left transition-colors",
              config.border,
              "cursor-pointer",
            )}
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{item.label}</span>
              <Badge variant={config.badge} className="text-[10px]">
                {config.label}
              </Badge>
            </div>
            <p className="text-muted-foreground text-xs">{item.reason}</p>
            <div className="text-muted-foreground flex items-center gap-1 text-xs italic">
              <MessageCircleQuestion className="size-3" />
              {item.question}
            </div>
          </button>
        );
      })}
    </div>
  );
}
