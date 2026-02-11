"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Building2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import {
  completeFollowUpAction,
  createFollowUpAction,
  snoozeFollowUpAction,
} from "@/features/follow-ups/follow-ups.action";
import { useRouter } from "next/navigation";

type OverdueFollowUp = {
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

type TodayUrgentProps = {
  overdueFollowUps: OverdueFollowUp[];
  staleMissions: StaleMission[];
};

export function TodayUrgent({
  overdueFollowUps,
  staleMissions,
}: TodayUrgentProps) {
  const router = useRouter();
  const [followUpAction, setFollowUpAction] = useState<{
    id: string;
    action: "complete" | "snooze";
  } | null>(null);
  const [schedulingMissionId, setSchedulingMissionId] = useState<string | null>(
    null,
  );

  const handleCompleteFollowUp = async (followUpId: string) => {
    setFollowUpAction({ id: followUpId, action: "complete" });
    try {
      await resolveActionResult(completeFollowUpAction({ id: followUpId }));
      toast.success("Relance complétée");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de la complétion",
      );
    } finally {
      setFollowUpAction(null);
    }
  };

  const handleSnoozeFollowUp = async (
    followUpId: string,
    currentScheduledAt: string,
  ) => {
    setFollowUpAction({ id: followUpId, action: "snooze" });

    const nextDate = new Date(currentScheduledAt);
    nextDate.setDate(nextDate.getDate() + 1);
    if (nextDate <= new Date()) {
      nextDate.setHours(new Date().getHours() + 2);
    }

    try {
      await resolveActionResult(
        snoozeFollowUpAction({ id: followUpId, scheduledAt: nextDate }),
      );
      toast.success("Relance reportée de 1 jour");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur");
    } finally {
      setFollowUpAction(null);
    }
  };

  const handleScheduleStaleFollowUp = async (mission: StaleMission) => {
    setSchedulingMissionId(mission.id);

    const nextBusinessMorning = new Date();
    nextBusinessMorning.setDate(nextBusinessMorning.getDate() + 1);
    nextBusinessMorning.setHours(9, 30, 0, 0);

    try {
      await resolveActionResult(
        createFollowUpAction({
          missionId: mission.id,
          type: "EMAIL",
          title: "Relance de reprise",
          description:
            "Relance recommandée automatiquement depuis Today pour mission stale.",
          scheduledAt: nextBusinessMorning,
        }),
      );
      toast.success("Relance planifiée pour demain matin");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur");
    } finally {
      setSchedulingMissionId(null);
    }
  };

  if (overdueFollowUps.length === 0 && staleMissions.length === 0) {
    return null;
  }

  return (
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
                        disabled={
                          followUpAction?.id === followUp.id &&
                          followUpAction.action === "complete"
                        }
                      >
                        Compléter
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () =>
                          handleSnoozeFollowUp(
                            followUp.id,
                            followUp.scheduledAt,
                          )
                        }
                        disabled={
                          followUpAction?.id === followUp.id &&
                          followUpAction.action === "snooze"
                        }
                      >
                        Reporter +1j
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
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void handleScheduleStaleFollowUp(mission)}
                      disabled={schedulingMissionId === mission.id}
                    >
                      Planifier relance
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
