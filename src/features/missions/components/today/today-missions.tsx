"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/nowts/empty-state";
import { ScoreRing } from "@/components/nowts/score-ring";
import { StatusBadge } from "@/components/nowts/status-badge";
import type { MissionStatus } from "@/components/nowts/status-badge";
import { Building2, CalendarCheck, ArrowRight, Rocket } from "lucide-react";
import Link from "next/link";

type RecentMission = {
  id: string;
  title: string;
  company: string | null;
  status: MissionStatus;
  score: number;
  createdAt: string;
};

type TodayMissionsProps = {
  recentMissions: RecentMission[];
};

export function TodayMissions({ recentMissions }: TodayMissionsProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarCheck className="size-4" />
            Missions récentes
          </CardTitle>
          {recentMissions.length > 0 && (
            <Link
              href="/app/pipeline"
              className="text-primary flex items-center gap-1 text-sm hover:underline"
            >
              Tout voir
              <ArrowRight className="size-3" />
            </Link>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {recentMissions.length === 0 ? (
          <EmptyState
            icon={Rocket}
            title="Aucune mission"
            description="Colle une URL d'annonce ci-dessus pour capturer ta première mission."
            className="py-6"
          />
        ) : (
          <div className="flex flex-col gap-2">
            {recentMissions.map((mission) => (
              <Link
                key={mission.id}
                href={`/app/pipeline`}
                className="hover:bg-muted flex items-center gap-3 rounded-lg border p-3 transition-colors"
              >
                <ScoreRing score={mission.score} size={28} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {mission.title}
                  </p>
                  {mission.company && (
                    <p className="text-muted-foreground flex items-center gap-1 text-xs">
                      <Building2 className="size-3 shrink-0" />
                      {mission.company}
                    </p>
                  )}
                </div>
                <StatusBadge status={mission.status} />
                <span className="text-muted-foreground text-xs">
                  {new Date(mission.createdAt).toLocaleDateString("fr-FR")}
                </span>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
