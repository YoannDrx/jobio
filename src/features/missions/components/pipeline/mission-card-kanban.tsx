"use client";

import { Badge } from "@/components/ui/badge";
import { ScoreRing } from "@/components/nowts/score-ring";
import { cn } from "@/lib/utils";
import { Building2, Calendar, Clock } from "lucide-react";

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
};

type MissionCardKanbanProps = {
  mission: KanbanMission;
  onClick?: () => void;
  className?: string;
  isPending?: boolean;
};

export function MissionCardKanban({
  mission,
  onClick,
  className,
  isPending = false,
}: MissionCardKanbanProps) {
  const hasFollowUp = mission.followUps.length > 0;
  const isUrgent = hasFollowUp
    ? new Date(mission.followUps[0].scheduledAt).getTime() - Date.now() <
      48 * 60 * 60 * 1000
    : false;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isPending}
      aria-busy={isPending}
      className={cn(
        "bg-card hover:border-primary/50 flex w-full cursor-pointer flex-col gap-2 rounded-lg border p-3 text-left transition-colors disabled:cursor-wait disabled:opacity-70",
        className,
      )}
    >
      {/* Row 1: Score + Title + Company */}
      <div className="flex items-start gap-2">
        <ScoreRing score={mission.score} size={28} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{mission.title}</p>
          {mission.company && (
            <p className="text-muted-foreground flex items-center gap-1 truncate text-xs">
              <Building2 className="size-3 shrink-0" />
              {mission.company}
            </p>
          )}
        </div>
      </div>

      {/* Row 2: TJM + WorkType + Duration */}
      <div className="flex flex-wrap items-center gap-1.5">
        {mission.tjm && (
          <span className="text-primary font-mono text-xs font-bold">
            {mission.tjm}€/j
          </span>
        )}
        {mission.workType && (
          <Badge variant="outline" className="px-1.5 py-0 text-xs">
            {mission.workType === "REMOTE"
              ? "Remote"
              : mission.workType === "HYBRID"
                ? "Hybride"
                : "Sur site"}
          </Badge>
        )}
        {mission.duration && (
          <span className="text-muted-foreground flex items-center gap-0.5 text-xs">
            <Clock className="size-3" /> {mission.duration}
          </span>
        )}
      </div>

      {/* Row 3: Next action */}
      {hasFollowUp && (
        <div
          className={cn(
            "flex items-center gap-1 text-xs",
            isUrgent ? "text-status-hot font-medium" : "text-muted-foreground",
          )}
        >
          <Calendar className="size-3" />
          {new Date(mission.followUps[0].scheduledAt).toLocaleDateString(
            "fr-FR",
          )}
        </div>
      )}

      {/* Row 4: Platform + Stack tags */}
      <div className="flex flex-wrap gap-1">
        {mission.platform && (
          <Badge variant="secondary" className="px-1.5 py-0 text-xs">
            {mission.platform.name}
          </Badge>
        )}
        {mission.stack.slice(0, 2).map((tech) => (
          <Badge key={tech} variant="outline" className="px-1.5 py-0 text-xs">
            {tech}
          </Badge>
        ))}
        {mission.stack.length > 2 && (
          <span className="text-muted-foreground text-xs">
            +{mission.stack.length - 2}
          </span>
        )}
      </div>
      {isPending ? (
        <span className="text-muted-foreground text-xs" role="status">
          Enregistrement…
        </span>
      ) : null}
    </button>
  );
}
