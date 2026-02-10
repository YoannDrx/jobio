"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/nowts/empty-state";
import { ScoreRing } from "@/components/nowts/score-ring";
import {
  MISSION_STATUS_CONFIG,
  StatusBadge,
} from "@/components/nowts/status-badge";
import type { MissionStatus } from "@/components/nowts/status-badge";
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
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CalendarCheck,
  Check,
  CheckCircle2,
  Clock,
  Kanban,
  Rocket,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { completeFollowUpAction } from "@/features/follow-ups/follow-ups.action";

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
  const [isCompletingFollowUp, setIsCompletingFollowUp] = useState<
    string | null
  >(null);

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

  const handleCompleteFollowUp = async (followUpId: string) => {
    setIsCompletingFollowUp(followUpId);
    try {
      await resolveActionResult(completeFollowUpAction({ id: followUpId }));
      toast.success("Relance complétée");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de la complétion",
      );
    } finally {
      setIsCompletingFollowUp(null);
    }
  };

  const typeLabels: Record<string, string> = {
    EMAIL: "Email",
    CALL: "Appel",
    MESSAGE: "Message",
    MEETING: "Réunion",
  };

  const hasUrgencies = overdueFollowUps.length > 0 || staleMissions.length > 0;
  const isClean =
    !hasUrgencies && todayFollowUps.length === 0 && totalMissions > 0;

  const DISPLAY_STATUSES: MissionStatus[] = [
    "A_POSTULER",
    "POSTULE",
    "ENTRETIEN",
    "PROPOSITION",
    "ACCEPTE",
    "REFUSE",
  ];

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
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="text-status-danger size-4" />
              Actions urgentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              {overdueFollowUps.length > 0 && (
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <Badge variant="destructive" className="text-xs">
                      {overdueFollowUps.length} en retard
                    </Badge>
                  </div>
                  <div className="flex flex-col gap-2">
                    {overdueFollowUps.map((followUp) => (
                      <div
                        key={followUp.id}
                        className="flex items-center gap-3 rounded-lg border p-3"
                      >
                        <div className="flex min-w-0 flex-1 flex-col gap-1">
                          <p className="truncate text-sm font-medium">
                            {followUp.title}
                          </p>
                          <p className="text-muted-foreground flex items-center gap-1 text-xs">
                            <Building2 className="size-3 shrink-0" />
                            {followUp.mission.title}
                            {followUp.mission.company && (
                              <> · {followUp.mission.company}</>
                            )}
                          </p>
                        </div>
                        <div className="flex shrink-0 gap-1">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={async () =>
                              handleCompleteFollowUp(followUp.id)
                            }
                            disabled={isCompletingFollowUp === followUp.id}
                          >
                            Compléter
                          </Button>
                          <Link
                            href={`/app/pipeline`}
                            className="text-primary hover:bg-muted flex items-center gap-1 rounded-md px-2 py-1 text-xs"
                          >
                            Voir
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {staleMissions.length > 0 && (
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="border-status-warning bg-status-warning/10 text-status-warning text-xs"
                    >
                      {staleMissions.length} missions stales
                    </Badge>
                  </div>
                  <div className="flex flex-col gap-2">
                    {staleMissions.map((mission) => (
                      <div
                        key={mission.id}
                        className="flex items-center gap-3 rounded-lg border p-3"
                      >
                        <div className="flex min-w-0 flex-1 flex-col gap-1">
                          <p className="truncate text-sm font-medium">
                            {mission.title}
                          </p>
                          <p className="text-muted-foreground flex items-center gap-1 text-xs">
                            <Building2 className="size-3 shrink-0" />
                            {mission.company ?? "Sans entreprise"}
                          </p>
                        </div>
                        <Link
                          href={`/app/pipeline`}
                          className="text-primary hover:bg-muted flex items-center gap-1 rounded-md px-2 py-1 text-xs"
                        >
                          Voir
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Today follow-ups section */}
      {todayFollowUps.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="size-4" />
              Aujourd&apos;hui
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              {todayFollowUps.map((followUp) => {
                const scheduledTime = new Date(followUp.scheduledAt);
                const timeStr = scheduledTime.toLocaleTimeString("fr-FR", {
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <div
                    key={followUp.id}
                    className="flex items-center gap-3 rounded-lg border p-3"
                  >
                    <div className="text-muted-foreground font-mono text-xs font-bold">
                      {timeStr}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium">
                          {followUp.title}
                        </p>
                        <Badge variant="outline" className="shrink-0 text-xs">
                          {typeLabels[followUp.type] ?? followUp.type}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground flex items-center gap-1 text-xs">
                        <Building2 className="size-3 shrink-0" />
                        {followUp.mission.title}
                        {followUp.mission.company && (
                          <> · {followUp.mission.company}</>
                        )}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="default"
                      onClick={async () => handleCompleteFollowUp(followUp.id)}
                      disabled={isCompletingFollowUp === followUp.id}
                    >
                      Compléter
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Week summary section */}
      {weekStats.missionsAdded > 0 || weekStats.followUpsCompleted > 0 ? (
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
      ) : null}

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
    </div>
  );
}
