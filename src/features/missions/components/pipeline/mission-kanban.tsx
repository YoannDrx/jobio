"use client";

import type { MissionStatus } from "@/components/nowts/status-badge";
import { MISSION_STATUS_CONFIG } from "@/components/nowts/status-badge";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { updateMissionStatusAction } from "@/features/missions/missions.action";
import { KANBAN_STATUS_VALUES } from "@/features/missions/mission-status";
import { DragDropContext, type DropResult } from "@hello-pangea/dnd";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ApplySequenceDialog } from "@/features/follow-ups/components/apply-sequence-dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { ScoreRing } from "@/components/nowts/score-ring";
import { Building2, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { KanbanColumn } from "./kanban-column";
import {
  applyOptimisticMissionStatus,
  applyOptimisticStatusCounters,
} from "./kanban-transition";

const KANBAN_STATUSES: MissionStatus[] = [...KANBAN_STATUS_VALUES];

type KanbanMission = {
  id: string;
  title: string;
  company: string | null;
  status: string;
  tjm: number | null;
  duration: string | null;
  workType: string | null;
  location: string | null;
  score: number;
  stack: string[];
  platform: { name: string } | null;
  followUps: { scheduledAt: Date }[];
  updatedAt: Date;
};

type MissionKanbanProps = {
  missions: KanbanMission[];
  counters: Record<string, number>;
  onMissionClick: (missionId: string) => void;
  onRefresh: () => void;
};

export function MissionKanban({
  missions: initialMissions,
  counters,
  onMissionClick,
  onRefresh,
}: MissionKanbanProps) {
  const [missions, setMissions] = useState(initialMissions);
  const [localCounters, setLocalCounters] = useState(counters);
  const [pendingMissionIds, setPendingMissionIds] = useState<Set<string>>(
    new Set(),
  );
  const pendingMissionIdsRef = useRef(new Set<string>());
  const [sequenceDialogMission, setSequenceDialogMission] = useState<{
    id: string;
    title: string;
  } | null>(null);

  useEffect(() => {
    setMissions(initialMissions);
  }, [initialMissions]);

  useEffect(() => {
    setLocalCounters(counters);
  }, [counters]);

  const setMissionPending = (missionId: string, pending: boolean) => {
    if (pending) {
      pendingMissionIdsRef.current.add(missionId);
    } else {
      pendingMissionIdsRef.current.delete(missionId);
    }
    setPendingMissionIds(new Set(pendingMissionIdsRef.current));
  };

  const transitionMission = async (params: {
    missionId: string;
    missionTitle: string;
    previousStatus: MissionStatus;
    nextStatus: MissionStatus;
    offerUndo?: boolean;
  }): Promise<void> => {
    if (pendingMissionIdsRef.current.has(params.missionId)) return;

    setMissionPending(params.missionId, true);
    setMissions((current) =>
      applyOptimisticMissionStatus(
        current,
        params.missionId,
        params.nextStatus,
      ),
    );
    setLocalCounters((current) =>
      applyOptimisticStatusCounters(
        current,
        params.previousStatus,
        params.nextStatus,
      ),
    );

    try {
      await resolveActionResult(
        updateMissionStatusAction({
          id: params.missionId,
          status: params.nextStatus,
          expectedStatus: params.previousStatus,
        }),
      );
      setMissionPending(params.missionId, false);
      onRefresh();

      const previousLabel = MISSION_STATUS_CONFIG[params.previousStatus].label;
      const nextLabel = MISSION_STATUS_CONFIG[params.nextStatus].label;
      toast.success(`${params.missionTitle} déplacée vers ${nextLabel}`, {
        description: `Statut précédent : ${previousLabel}`,
        duration: params.offerUndo === false ? 3500 : 7000,
        ...(params.offerUndo === false
          ? {}
          : {
              action: {
                label: "Annuler",
                onClick: () => {
                  setSequenceDialogMission((current) =>
                    current?.id === params.missionId ? null : current,
                  );
                  void transitionMission({
                    missionId: params.missionId,
                    missionTitle: params.missionTitle,
                    previousStatus: params.nextStatus,
                    nextStatus: params.previousStatus,
                    offerUndo: false,
                  });
                },
              },
            }),
      });

      if (params.nextStatus === "POSTULE") {
        setSequenceDialogMission({
          id: params.missionId,
          title: params.missionTitle,
        });
      }
    } catch (error) {
      setMissionPending(params.missionId, false);
      setMissions((current) =>
        applyOptimisticMissionStatus(
          current,
          params.missionId,
          params.previousStatus,
        ),
      );
      setLocalCounters((current) =>
        applyOptimisticStatusCounters(
          current,
          params.nextStatus,
          params.previousStatus,
        ),
      );
      onRefresh();
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors du changement de statut",
        {
          action: {
            label: "Réessayer",
            onClick: () => void transitionMission(params),
          },
        },
      );
    }
  };

  const handleDragEnd = (result: DropResult) => {
    const { draggableId, destination } = result;

    if (!destination) return;
    if (pendingMissionIdsRef.current.has(draggableId)) return;

    const newStatus = destination.droppableId as MissionStatus;
    const mission = missions.find((m) => m.id === draggableId);

    if (!mission || mission.status === newStatus) return;

    void transitionMission({
      missionId: draggableId,
      missionTitle: mission.title,
      previousStatus: mission.status as MissionStatus,
      nextStatus: newStatus,
    });
  };

  const getMissionsByStatus = (status: MissionStatus) =>
    missions.filter((m) => m.status === status);

  const getAverageDaysInStatus = (
    statusMissions: KanbanMission[],
  ): number | null => {
    if (statusMissions.length === 0) return null;
    const now = Date.now();
    const days = statusMissions.map((m) =>
      Math.floor(
        (now - new Date(m.updatedAt).getTime()) / (1000 * 60 * 60 * 24),
      ),
    );
    return Math.round(days.reduce((a, b) => a + b, 0) / days.length);
  };

  return (
    <>
      {/* Mobile accordion view */}
      <div className="flex flex-col gap-2 md:hidden">
        {KANBAN_STATUSES.map((status) => {
          const config = MISSION_STATUS_CONFIG[status];
          const statusMissions = getMissionsByStatus(status);
          const count = localCounters[status] ?? 0;

          return (
            <Collapsible key={status} defaultOpen={statusMissions.length > 0}>
              <CollapsibleTrigger className="hover:bg-muted/50 flex w-full items-center gap-2 rounded-lg border p-3 transition-colors">
                <ChevronRight className="size-4 shrink-0 transition-transform [[data-state=open]>&]:rotate-90" />
                <span
                  className={cn(
                    "inline-block size-2 rounded-full",
                    config.className.split(" ")[0],
                  )}
                />
                <span className="text-sm font-medium">{config.label}</span>
                <Badge
                  variant="secondary"
                  className="ml-auto font-mono text-xs"
                >
                  {count}
                </Badge>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="flex flex-col gap-2 pt-2">
                  {statusMissions.length === 0 ? (
                    <p className="text-muted-foreground px-3 py-2 text-center text-sm">
                      Aucune mission
                    </p>
                  ) : (
                    statusMissions.map((mission) => (
                      <button
                        type="button"
                        key={mission.id}
                        onClick={() => onMissionClick(mission.id)}
                        className="bg-card hover:border-primary/50 flex w-full cursor-pointer items-center gap-3 rounded-lg border p-3 text-left transition-colors"
                      >
                        <ScoreRing score={mission.score} size={28} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {mission.title}
                          </p>
                          {mission.company && (
                            <p className="text-muted-foreground flex items-center gap-1 truncate text-xs">
                              <Building2 className="size-3 shrink-0" />
                              {mission.company}
                            </p>
                          )}
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          {mission.tjm && (
                            <span className="text-primary font-mono text-xs font-bold">
                              {mission.tjm}€/j
                            </span>
                          )}
                          {mission.stack.slice(0, 2).map((tech) => (
                            <Badge
                              key={tech}
                              variant="outline"
                              className="hidden px-1.5 py-0 text-xs sm:inline-flex"
                            >
                              {tech}
                            </Badge>
                          ))}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>

      {/* Desktop kanban view */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="hidden gap-4 overflow-x-auto pb-4 md:flex">
          {KANBAN_STATUSES.map((status) => {
            const statusMissions = getMissionsByStatus(status);
            return (
              <KanbanColumn
                key={status}
                status={status}
                missions={statusMissions}
                count={localCounters[status] ?? 0}
                avgDaysInStatus={getAverageDaysInStatus(statusMissions)}
                onMissionClick={onMissionClick}
                pendingMissionIds={pendingMissionIds}
              />
            );
          })}
        </div>
      </DragDropContext>
      {sequenceDialogMission && (
        <ApplySequenceDialog
          missionId={sequenceDialogMission.id}
          missionTitle={sequenceDialogMission.title}
          open={true}
          onOpenChange={(open) => {
            if (!open) setSequenceDialogMission(null);
          }}
          onApplied={() => {
            setSequenceDialogMission(null);
            onRefresh();
          }}
        />
      )}
    </>
  );
}
