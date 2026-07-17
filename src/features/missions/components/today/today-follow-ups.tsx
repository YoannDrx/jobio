"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Building2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import {
  completeFollowUpAction,
  snoozeFollowUpAction,
} from "@/features/follow-ups/follow-ups.action";
import { useRouter } from "next/navigation";

type TodayFollowUp = {
  id: string;
  title: string;
  type: string;
  scheduledAt: string;
  mission: {
    id: string;
    title: string;
    company: string | null;
    status: string;
  };
};

type TodayFollowUpsProps = {
  todayFollowUps: TodayFollowUp[];
};

const typeLabels: Record<string, string> = {
  EMAIL: "Email",
  CALL: "Appel",
  MESSAGE: "Message",
  MEETING: "Réunion",
};

export function TodayFollowUps({ todayFollowUps }: TodayFollowUpsProps) {
  const router = useRouter();
  const [followUpAction, setFollowUpAction] = useState<{
    id: string;
    action: "complete" | "snooze";
  } | null>(null);

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

  return (
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
                    handleSnoozeFollowUp(followUp.id, followUp.scheduledAt)
                  }
                  disabled={
                    followUpAction?.id === followUp.id &&
                    followUpAction.action === "snooze"
                  }
                >
                  Reporter +1j
                </Button>
                <Link
                  href={`/job/pipeline?missionId=${followUp.mission.id}`}
                  className="text-primary hover:bg-muted flex items-center gap-1 rounded-md px-2 py-1 text-xs"
                >
                  Voir
                </Link>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
