"use client";

import { MISSION_STATUS_CONFIG } from "@/components/nowts/status-badge";
import type { MissionStatus } from "@/components/nowts/status-badge";
import { cn } from "@/lib/utils";
import { Draggable, Droppable } from "@hello-pangea/dnd";
import { MissionCardKanban } from "./mission-card-kanban";

type KanbanMission = {
  id: string;
  title: string;
  company: string | null;
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

type KanbanColumnProps = {
  status: MissionStatus;
  missions: KanbanMission[];
  count: number;
  avgDaysInStatus?: number | null;
  onMissionClick: (missionId: string) => void;
};

export function KanbanColumn({
  status,
  missions,
  count,
  avgDaysInStatus,
  onMissionClick,
}: KanbanColumnProps) {
  const config = MISSION_STATUS_CONFIG[status];

  return (
    <div className="flex w-72 shrink-0 flex-col">
      {/* Header */}
      <div className="mb-2 flex flex-col gap-1 px-1">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "inline-block size-2 rounded-full",
              config.className.split(" ")[0],
            )}
          />
          <span className="text-sm font-medium">{config.label}</span>
          <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 font-mono text-xs">
            {count}
          </span>
        </div>
        {avgDaysInStatus !== null && avgDaysInStatus !== undefined && (
          <span className="text-muted-foreground px-1 text-xs">
            Moy. {avgDaysInStatus}j
          </span>
        )}
      </div>

      {/* Droppable area */}
      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "flex min-h-[200px] flex-1 flex-col gap-2 rounded-lg border border-dashed p-2 transition-colors",
              snapshot.isDraggingOver
                ? "border-primary/50 bg-primary/5"
                : "border-transparent",
            )}
          >
            {missions.map((mission, index) => (
              <Draggable
                key={mission.id}
                draggableId={mission.id}
                index={index}
              >
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                  >
                    <MissionCardKanban
                      mission={mission}
                      onClick={() => onMissionClick(mission.id)}
                      className={cn(
                        snapshot.isDragging && "rotate-2 shadow-lg",
                      )}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}
