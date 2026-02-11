"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Rocket, TrendingUp } from "lucide-react";

type WeekStats = {
  missionsAdded: number;
  followUpsCompleted: number;
};

type TodayStatsProps = {
  weekStats: WeekStats;
};

export function TodayStats({ weekStats }: TodayStatsProps) {
  if (weekStats.missionsAdded === 0 && weekStats.followUpsCompleted === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="size-4" />
          Cette semaine
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4">
          {weekStats.missionsAdded > 0 && (
            <div className="flex items-center gap-2">
              <div className="bg-muted rounded-lg p-2">
                <Rocket className="text-muted-foreground size-4" />
              </div>
              <div>
                <p className="font-mono text-sm font-bold">
                  {weekStats.missionsAdded}
                </p>
                <p className="text-muted-foreground text-xs">
                  mission
                  {weekStats.missionsAdded > 1 ? "s" : ""} ajoutée
                  {weekStats.missionsAdded > 1 ? "s" : ""}
                </p>
              </div>
            </div>
          )}
          {weekStats.followUpsCompleted > 0 && (
            <div className="flex items-center gap-2">
              <div className="bg-muted rounded-lg p-2">
                <Check className="text-muted-foreground size-4" />
              </div>
              <div>
                <p className="font-mono text-sm font-bold">
                  {weekStats.followUpsCompleted}
                </p>
                <p className="text-muted-foreground text-xs">
                  relance
                  {weekStats.followUpsCompleted > 1 ? "s" : ""} complétée
                  {weekStats.followUpsCompleted > 1 ? "s" : ""}
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
