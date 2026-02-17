"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { getProfileCompletenessAction } from "@/features/profiles/profile-completeness.action";
import type { ProfileCompleteness as ProfileCompletenessData } from "@/features/profiles/profile-completeness";
import { CircleCheck, CircleAlert, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

function getScoreColor(score: number) {
  if (score >= 80) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 50) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

function getProgressClass(score: number) {
  if (score >= 80) return "[&>[data-slot=progress-indicator]]:bg-emerald-500";
  if (score >= 50) return "[&>[data-slot=progress-indicator]]:bg-amber-500";
  return "[&>[data-slot=progress-indicator]]:bg-red-500";
}

export function ProfileCompleteness() {
  const [data, setData] = useState<ProfileCompletenessData | null>(null);

  useEffect(() => {
    void resolveActionResult(getProfileCompletenessAction()).then(setData);
  }, []);

  if (!data) return null;

  const { score, missingFields } = data;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">
            Completude du profil
          </CardTitle>
          <span
            className={`text-lg font-bold tabular-nums ${getScoreColor(score)}`}
          >
            {score}%
          </span>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Progress value={score} className={`h-2 ${getProgressClass(score)}`} />

        {missingFields.length === 0 ? (
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <CircleCheck className="size-4" />
            <span className="text-sm">Profil complet !</span>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5">
              <CircleAlert className="text-muted-foreground size-3.5" />
              <span className="text-muted-foreground text-xs">
                {missingFields.length} champ
                {missingFields.length > 1 ? "s" : ""} manquant
                {missingFields.length > 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {missingFields.map((field) => (
                <span
                  key={field.key}
                  className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-xs"
                >
                  {field.label}
                </span>
              ))}
            </div>
            <Link
              href="/app/profiles"
              className="text-primary mt-1 flex items-center gap-1 text-xs font-medium hover:underline"
            >
              Completer mon profil
              <ArrowRight className="size-3" />
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
