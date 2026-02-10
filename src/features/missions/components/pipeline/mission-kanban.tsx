"use client";

import type { MissionStatus } from "@/components/nowts/status-badge";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { updateMissionStatusAction } from "@/features/missions/missions.action";
import { DragDropContext, type DropResult } from "@hello-pangea/dnd";
import { useState } from "react";
import { toast } from "sonner";
import { ApplySequenceDialog } from "@/features/follow-ups/components/apply-sequence-dialog";
import { KanbanColumn } from "./kanban-column";

const KANBAN_STATUSES: MissionStatus[] = [
  "A_POSTULER",
  "POSTULE",
  "ENTRETIEN",
  "PROPOSITION",
  "ACCEPTE",
  "REFUSE",
];

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
  const [sequenceDialogMission, setSequenceDialogMission] = useState<{
    id: string;
    title: string;
  } | null>(null);

  // Update missions when props change
  if (
    initialMissions !== missions &&
    JSON.stringify(initialMissions) !== JSON.stringify(missions)
  ) {
    setMissions(initialMissions);
  }

  const handleDragEnd = async (result: DropResult) => {
    const { draggableId, destination } = result;

    if (!destination) return;

    const newStatus = destination.droppableId as MissionStatus;
    const mission = missions.find((m) => m.id === draggableId);

    if (!mission || mission.status === newStatus) return;

    // Optimistic update
    setMissions((prev) =>
      prev.map((m) => (m.id === draggableId ? { ...m, status: newStatus } : m)),
    );

    try {
      await resolveActionResult(
        updateMissionStatusAction({ id: draggableId, status: newStatus }),
      );
      if (newStatus === "POSTULE") {
        setSequenceDialogMission({ id: draggableId, title: mission.title });
      }
      onRefresh();
    } catch (error) {
      // Revert on error
      setMissions((prev) =>
        prev.map((m) =>
          m.id === draggableId ? { ...m, status: mission.status } : m,
        ),
      );
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors du changement de statut",
      );
    }
  };

  const getMissionsByStatus = (status: MissionStatus) =>
    missions.filter((m) => m.status === status);

  return (
    <>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {KANBAN_STATUSES.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              missions={getMissionsByStatus(status)}
              count={counters[status] ?? 0}
              onMissionClick={onMissionClick}
            />
          ))}
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
