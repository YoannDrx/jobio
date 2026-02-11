"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { parseMissionAction } from "@/features/ai/parse-mission.action";
import { createMissionAction } from "@/features/missions/missions.action";
import type { MissionParserOutput } from "@/features/ai/prompts/mission-parser.prompt";
import { QuickCaptureInput } from "@/features/missions/components/capture/quick-capture-input";
import { MissionPreview } from "@/features/missions/components/capture/mission-preview";
import { OnboardingWizard } from "@/features/onboarding/components/onboarding-wizard";
import {
  TodaySuggestions,
  type Suggestion,
} from "@/features/missions/components/today/today-suggestions";
import { TodayUrgent } from "@/features/missions/components/today/today-urgent";
import { TodayFollowUps } from "@/features/missions/components/today/today-follow-ups";
import { TodayStats } from "@/features/missions/components/today/today-stats";
import { TodayMissions } from "@/features/missions/components/today/today-missions";
import { ArrowRight, CheckCircle2, Kanban, Rocket } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { MISSION_STATUS_CONFIG } from "@/components/nowts/status-badge";
import type { MissionStatus } from "@/components/nowts/status-badge";
import { TODAY_SUMMARY_STATUS_VALUES } from "@/features/missions/mission-status";
import { checkTodayNotificationsAction } from "@/features/notifications/check-today-notifications.action";

type RecentMission = {
  id: string;
  title: string;
  company: string | null;
  status: MissionStatus;
  score: number;
  createdAt: string;
};

type OverdueFollowUp = {
  id: string;
  title: string;
  type: string;
  scheduledAt: string;
  mission: { title: string; company: string | null; status: string };
};

type TodayFollowUp = {
  id: string;
  title: string;
  type: string;
  scheduledAt: string;
  mission: { title: string; company: string | null; status: string };
};

type StaleMission = {
  id: string;
  title: string;
  company: string | null;
  status: string;
  updatedAt: string;
};

type WeekStats = {
  missionsAdded: number;
  followUpsCompleted: number;
};

type TodayContentProps = {
  recentMissions: RecentMission[];
  counters: Record<string, number>;
  totalMissions: number;
  overdueFollowUps: OverdueFollowUp[];
  todayFollowUps: TodayFollowUp[];
  staleMissions: StaleMission[];
  weekStats: WeekStats;
  suggestions: Suggestion[];
  onboardingStatus?: {
    hasProfile: boolean;
    hasPlatforms: boolean;
    hasMission: boolean;
    hasSequence: boolean;
    isDismissed: boolean;
  } | null;
};

export function TodayContent({
  recentMissions,
  counters,
  totalMissions,
  overdueFollowUps,
  todayFollowUps,
  staleMissions,
  weekStats,
  suggestions,
  onboardingStatus,
}: TodayContentProps) {
  const router = useRouter();
  const [isParsing, setIsParsing] = useState(false);
  const [parsedData, setParsedData] = useState<MissionParserOutput | null>(
    null,
  );
  const [isCreating, setIsCreating] = useState(false);
  const notificationsCheckedRef = useRef(false);

  useEffect(() => {
    if (notificationsCheckedRef.current) return;
    notificationsCheckedRef.current = true;

    const dueSoonFollowUps = todayFollowUps.filter((followUp) => {
      const timeUntilDue =
        new Date(followUp.scheduledAt).getTime() - Date.now();
      return timeUntilDue > 0 && timeUntilDue <= 2 * 60 * 60 * 1000;
    });

    void checkTodayNotificationsAction({
      overdueFollowUps: overdueFollowUps.slice(0, 3).map((f) => ({
        id: f.id,
        title: f.title,
        missionTitle: f.mission.title,
      })),
      staleMissions: staleMissions.slice(0, 3).map((m) => ({
        id: m.id,
        title: m.title,
      })),
      dueSoonFollowUps: dueSoonFollowUps.slice(0, 2).map((f) => ({
        id: f.id,
        title: f.title,
        missionTitle: f.mission.title,
      })),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleParse = async (source: "url" | "text", content: string) => {
    setIsParsing(true);
    try {
      const result = await resolveActionResult(
        parseMissionAction({ source, content }),
      );
      setParsedData(result);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur lors du parsing",
      );
    } finally {
      setIsParsing(false);
    }
  };

  const handleConfirmParsed = async (data: MissionParserOutput) => {
    setIsCreating(true);
    try {
      await resolveActionResult(
        createMissionAction({
          title: data.title,
          company: data.company ?? undefined,
          description: data.description,
          stack: data.stack,
          tjm: data.tjm ?? undefined,
          duration: data.duration ?? undefined,
          workType: data.workType ?? undefined,
          location: data.location ?? undefined,
        }),
      );
      toast.success("Mission créée avec succès");
      setParsedData(null);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de la création",
      );
    } finally {
      setIsCreating(false);
    }
  };

  const hasUrgencies = overdueFollowUps.length > 0 || staleMissions.length > 0;
  const isClean =
    !hasUrgencies && todayFollowUps.length === 0 && totalMissions > 0;

  const DISPLAY_STATUSES: MissionStatus[] = [...TODAY_SUMMARY_STATUS_VALUES];

  return (
    <div className="flex flex-col gap-6">
      {/* Quick capture */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Rocket className="size-4" />
            Capture rapide
          </CardTitle>
        </CardHeader>
        <CardContent>
          <QuickCaptureInput onParse={handleParse} isLoading={isParsing} />
        </CardContent>
      </Card>

      {/* Onboarding wizard */}
      {onboardingStatus && (
        <OnboardingWizard
          status={{
            hasProfile: onboardingStatus.hasProfile,
            hasPlatforms: onboardingStatus.hasPlatforms,
            hasMission: onboardingStatus.hasMission,
            hasSequence: onboardingStatus.hasSequence,
            isDismissed: onboardingStatus.isDismissed,
          }}
        />
      )}

      {/* Parsed preview */}
      {parsedData && (
        <MissionPreview
          data={parsedData}
          onConfirm={handleConfirmParsed}
          onCancel={() => setParsedData(null)}
          isLoading={isCreating}
        />
      )}

      {/* Suggestions */}
      <TodaySuggestions suggestions={suggestions} />

      {/* Urgent actions section */}
      {hasUrgencies && (
        <TodayUrgent
          overdueFollowUps={overdueFollowUps}
          staleMissions={staleMissions}
        />
      )}

      {/* Today follow-ups section */}
      {todayFollowUps.length > 0 && (
        <TodayFollowUps todayFollowUps={todayFollowUps} />
      )}

      {/* Week summary section */}
      <TodayStats weekStats={weekStats} />

      {/* Clean state section */}
      {isClean && (
        <Card className="border-status-success/30 bg-status-success/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-center">
              <CheckCircle2 className="text-status-success size-5 shrink-0" />
              <p className="text-status-success text-sm font-medium">
                Pipeline propre. Rien d&apos;urgent aujourd&apos;hui.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pipeline summary */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Kanban className="size-4" />
              Pipeline
              <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 font-mono text-xs">
                {totalMissions}
              </span>
            </CardTitle>
            <Link
              href="/app/pipeline"
              className="text-primary flex items-center gap-1 text-sm hover:underline"
            >
              Voir tout
              <ArrowRight className="size-3" />
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {totalMissions === 0 ? (
            <p className="text-muted-foreground text-sm">
              Pas encore de missions. Colle une annonce ci-dessus pour
              commencer.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {DISPLAY_STATUSES.map((status) => {
                const count = counters[status] ?? 0;
                if (count === 0) return null;
                const config = MISSION_STATUS_CONFIG[status];
                return (
                  <Link
                    key={status}
                    href={`/app/pipeline?status=${status}`}
                    className="hover:bg-muted flex items-center gap-2 rounded-lg border px-3 py-2 transition-colors"
                  >
                    <span className="font-mono text-sm font-bold">{count}</span>
                    <span className="text-muted-foreground text-sm">
                      {config.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent missions */}
      <TodayMissions recentMissions={recentMissions} />
    </div>
  );
}
