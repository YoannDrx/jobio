"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CalendarClock,
  Check,
  Clock3,
  Lightbulb,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  completeFollowUpAction,
  createFollowUpAction,
  snoozeFollowUpAction,
} from "@/features/follow-ups/follow-ups.action";
import type { Suggestion } from "@/features/missions/components/today/today-suggestions";
import { resolveActionResult } from "@/lib/actions/actions-utils";

type FollowUp = {
  id: string;
  title: string;
  scheduledAt: string;
  mission: {
    id: string;
    title: string;
    company: string | null;
  };
};

type StaleMission = {
  id: string;
  title: string;
  company: string | null;
  updatedAt: string;
};

export type TodayPriority =
  | { kind: "overdue"; followUp: FollowUp }
  | { kind: "today"; followUp: FollowUp }
  | { kind: "stale"; mission: StaleMission }
  | { kind: "suggestion"; suggestion: Suggestion };

type TodayPrioritiesProps = {
  overdueFollowUps: FollowUp[];
  todayFollowUps: FollowUp[];
  staleMissions: StaleMission[];
  suggestions: Suggestion[];
};

export const buildTodayPriorities = ({
  overdueFollowUps,
  todayFollowUps,
  staleMissions,
  suggestions,
}: TodayPrioritiesProps): TodayPriority[] =>
  [
    ...overdueFollowUps.map(
      (followUp): TodayPriority => ({ kind: "overdue", followUp }),
    ),
    ...todayFollowUps.map(
      (followUp): TodayPriority => ({ kind: "today", followUp }),
    ),
    ...staleMissions.map(
      (mission): TodayPriority => ({ kind: "stale", mission }),
    ),
    ...suggestions.map(
      (suggestion): TodayPriority => ({ kind: "suggestion", suggestion }),
    ),
  ].slice(0, 3);

const getNextBusinessMorning = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  while (date.getDay() === 0 || date.getDay() === 6) {
    date.setDate(date.getDate() + 1);
  }
  date.setHours(9, 30, 0, 0);
  return date;
};

export function TodayPriorities({
  overdueFollowUps,
  todayFollowUps,
  staleMissions,
  suggestions,
}: TodayPrioritiesProps) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const priorities = useMemo(() => {
    return buildTodayPriorities({
      overdueFollowUps,
      todayFollowUps,
      staleMissions,
      suggestions,
    });
  }, [overdueFollowUps, staleMissions, suggestions, todayFollowUps]);

  const complete = async (followUp: FollowUp) => {
    setPendingId(followUp.id);
    try {
      await resolveActionResult(completeFollowUpAction({ id: followUp.id }));
      toast.success("Relance terminée");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action impossible");
    } finally {
      setPendingId(null);
    }
  };

  const snooze = async (followUp: FollowUp) => {
    const scheduledAt = new Date(followUp.scheduledAt);
    scheduledAt.setDate(scheduledAt.getDate() + 1);
    if (scheduledAt <= new Date())
      scheduledAt.setTime(Date.now() + 2 * 60 * 60 * 1000);

    setPendingId(followUp.id);
    try {
      await resolveActionResult(
        snoozeFollowUpAction({ id: followUp.id, scheduledAt }),
      );
      toast.success("Relance reportée");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action impossible");
    } finally {
      setPendingId(null);
    }
  };

  const schedule = async (mission: StaleMission) => {
    setPendingId(mission.id);
    try {
      await resolveActionResult(
        createFollowUpAction({
          missionId: mission.id,
          type: "EMAIL",
          title: "Relance de reprise",
          description: "Relance planifiée depuis les priorités du jour.",
          scheduledAt: getNextBusinessMorning(),
        }),
      );
      toast.success("Relance planifiée au prochain jour ouvré");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action impossible");
    } finally {
      setPendingId(null);
    }
  };

  if (priorities.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarClock className="text-primary size-4" />
            Tes priorités
          </CardTitle>
          <span className="text-muted-foreground text-xs">
            3 actions maximum
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <ol className="space-y-3">
          {priorities.map((priority, index) => {
            if (priority.kind === "suggestion") {
              return (
                <li
                  key={priority.suggestion.id}
                  className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center"
                >
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <span className="bg-secondary text-secondary-foreground flex size-7 shrink-0 items-center justify-center rounded-full font-mono text-xs font-bold">
                      {index + 1}
                    </span>
                    <div>
                      <Badge variant="outline" className="mb-2">
                        <Lightbulb className="size-3" />
                        Opportunité
                      </Badge>
                      <p className="text-sm font-medium">
                        {priority.suggestion.message}
                      </p>
                      <p className="text-muted-foreground mt-1 text-xs">
                        Impact : améliorer la qualité du pipeline
                      </p>
                    </div>
                  </div>
                  {priority.suggestion.link && (
                    <Button asChild variant="outline" className="min-h-11">
                      <Link href={priority.suggestion.link}>
                        Ouvrir <ArrowRight />
                      </Link>
                    </Button>
                  )}
                </li>
              );
            }

            const isStale = priority.kind === "stale";
            const item = isStale ? priority.mission : priority.followUp;
            const company = isStale
              ? priority.mission.company
              : priority.followUp.mission.company;
            const contextTitle = isStale
              ? priority.mission.title
              : priority.followUp.mission.title;
            const missionId = isStale
              ? priority.mission.id
              : priority.followUp.mission.id;
            const isOverdue = priority.kind === "overdue";

            return (
              <li
                key={`${priority.kind}-${item.id}`}
                className="flex flex-col gap-4 rounded-lg border p-4"
              >
                <div className="flex items-start gap-3">
                  <span className="bg-secondary text-secondary-foreground flex size-7 shrink-0 items-center justify-center rounded-full font-mono text-xs font-bold">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <Badge
                      variant={isOverdue ? "destructive" : "outline"}
                      className="mb-2"
                    >
                      {isOverdue ? (
                        <AlertTriangle className="size-3" />
                      ) : (
                        <Clock3 className="size-3" />
                      )}
                      {isOverdue
                        ? "En retard — maintenant"
                        : isStale
                          ? "Pipeline inactif"
                          : "Prévue aujourd'hui"}
                    </Badge>
                    <p className="truncate text-sm font-semibold">
                      {isStale ? `Relancer ${contextTitle}` : item.title}
                    </p>
                    <p className="text-muted-foreground mt-1 flex items-center gap-1 text-xs">
                      <Building2 className="size-3" />
                      {company ?? contextTitle}
                    </p>
                    <p className="text-muted-foreground mt-2 text-xs">
                      Impact :{" "}
                      {isStale
                        ? "réactiver une opportunité"
                        : "maintenir le rythme de relance"}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap justify-end gap-2 border-t pt-3">
                  <Button asChild variant="ghost" className="min-h-11">
                    <Link href={`/job/pipeline?missionId=${missionId}`}>
                      Contexte <ArrowRight />
                    </Link>
                  </Button>
                  {isStale ? (
                    <Button
                      className="min-h-11"
                      disabled={pendingId === item.id}
                      onClick={() => void schedule(priority.mission)}
                    >
                      <CalendarClock /> Planifier
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        className="min-h-11"
                        disabled={pendingId === item.id}
                        onClick={() => void snooze(priority.followUp)}
                      >
                        <Clock3 /> Reporter
                      </Button>
                      <Button
                        className="min-h-11"
                        disabled={pendingId === item.id}
                        onClick={() => void complete(priority.followUp)}
                      >
                        <Check /> Terminer
                      </Button>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}
