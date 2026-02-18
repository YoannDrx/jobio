"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Check, Clock, TrendingUp, AlertCircle } from "lucide-react";

type TodayWeeklySummaryProps = {
  weekFollowUpsCompleted: number;
  weekMissionsAdded: number;
  weekResponseRate: number | null;
  staleCount: number;
};

export function TodayWeeklySummary({
  weekFollowUpsCompleted,
  weekMissionsAdded,
  weekResponseRate,
  staleCount,
}: TodayWeeklySummaryProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {/* Missions added */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="bg-muted rounded-lg p-2">
                <TrendingUp className="text-muted-foreground size-4" />
              </div>
            </div>
            <p className="font-mono text-lg font-bold">{weekMissionsAdded}</p>
            <p className="text-muted-foreground text-xs">
              mission{weekMissionsAdded > 1 ? "s" : ""} ajoutée
              {weekMissionsAdded > 1 ? "s" : ""}
            </p>
          </div>

          {/* Follow-ups completed */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="bg-muted rounded-lg p-2">
                <Check className="text-muted-foreground size-4" />
              </div>
            </div>
            <p className="font-mono text-lg font-bold">
              {weekFollowUpsCompleted}
            </p>
            <p className="text-muted-foreground text-xs">
              relance{weekFollowUpsCompleted > 1 ? "s" : ""} complétée
              {weekFollowUpsCompleted > 1 ? "s" : ""}
            </p>
          </div>

          {/* Response rate */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="bg-muted rounded-lg p-2">
                <Clock className="text-muted-foreground size-4" />
              </div>
            </div>
            <p className="font-mono text-lg font-bold">
              {weekResponseRate !== null
                ? `${Math.round(weekResponseRate)}%`
                : "—"}
            </p>
            <p className="text-muted-foreground text-xs">taux de réponse</p>
          </div>

          {/* Stale missions */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div
                className={`rounded-lg p-2 ${staleCount > 0 ? "bg-status-warning/10" : "bg-muted"}`}
              >
                <AlertCircle
                  className={`size-4 ${staleCount > 0 ? "text-status-warning" : "text-muted-foreground"}`}
                />
              </div>
            </div>
            <p className="font-mono text-lg font-bold">{staleCount}</p>
            <p className="text-muted-foreground text-xs">
              mission{staleCount > 1 ? "s" : ""} stale
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
