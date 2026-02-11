"use client";

import { Badge } from "@/components/ui/badge";
import type { ScoreBreakdown as ScoreBreakdownType } from "@/features/missions/mission-scoring";

type ScoreBreakdownProps = {
  breakdown: ScoreBreakdownType["breakdown"];
};

const CATEGORY_LABELS: Record<keyof ScoreBreakdownType["breakdown"], string> = {
  skills: "Competences",
  tjm: "TJM",
  workType: "Mode de travail",
  location: "Localisation",
  completeness: "Completude",
};

function getBarColor(score: number, max: number): string {
  if (max === 0) return "bg-muted";
  const ratio = score / max;
  if (ratio > 0.75) return "bg-emerald-500";
  if (ratio > 0.5) return "bg-amber-500";
  return "bg-red-500";
}

function getTextColor(score: number, max: number): string {
  if (max === 0) return "text-muted-foreground";
  const ratio = score / max;
  if (ratio > 0.75) return "text-emerald-600";
  if (ratio > 0.5) return "text-amber-600";
  return "text-red-600";
}

export function ScoreBreakdown({ breakdown }: ScoreBreakdownProps) {
  const categories = Object.entries(breakdown) as [
    keyof ScoreBreakdownType["breakdown"],
    ScoreBreakdownType["breakdown"][keyof ScoreBreakdownType["breakdown"]],
  ][];

  return (
    <div className="flex flex-col gap-3">
      <h4 className="text-sm font-medium">Detail du score</h4>
      <div className="flex flex-col gap-2">
        {categories.map(([key, value]) => {
          const percentage =
            value.max > 0 ? (value.score / value.max) * 100 : 0;

          return (
            <div key={key} className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs">
                  {CATEGORY_LABELS[key]}
                </span>
                <span
                  className={`font-mono text-xs font-medium ${getTextColor(value.score, value.max)}`}
                >
                  {value.score}/{value.max}
                </span>
              </div>
              <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
                <div
                  className={`h-full rounded-full transition-all ${getBarColor(value.score, value.max)}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              {key === "skills" &&
                "matched" in value &&
                value.matched.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {value.matched.map((skill: string) => (
                      <Badge
                        key={skill}
                        variant="secondary"
                        className="px-1.5 py-0 text-[10px]"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
