"use client";

import { ScoreRing } from "@/components/nowts/score-ring";
import { StatusBadge } from "@/components/nowts/status-badge";
import type { MissionStatus } from "@/components/nowts/status-badge";
import { SheetTitle } from "@/components/ui/sheet";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { recalculateScoreAction } from "@/features/missions/missions.action";
import { RefreshCw, Building2 } from "lucide-react";
import { toast } from "sonner";
import type { JsonValue } from "@/generated/prisma/runtime/library";
import type { ScoreBreakdown as ScoreBreakdownType } from "@/features/missions/mission-scoring";

export type MissionWithRelations = {
  id: string;
  title: string;
  company: string | null;
  description: string | null;
  status: MissionStatus;
  priority: string;
  tjm: number | null;
  duration: string | null;
  workType: string | null;
  location: string | null;
  stack: string[];
  sourceUrl: string | null;
  score: number;
  scoreBreakdown: JsonValue | null;
  notes: string | null;
  createdAt: Date;
  platform: { name: string } | null;
  profile: { id: string; name: string } | null;
  contact: {
    firstName: string;
    lastName: string;
    company: string | null;
    email: string | null;
    role: string | null;
  } | null;
  followUps: {
    id: string;
    title: string;
    description: string | null;
    scheduledAt: Date;
    completedAt: Date | null;
    type: string;
    templateId: string | null;
  }[];
  activityEvents: {
    id: string;
    type: string;
    description: string | null;
    createdAt: Date;
  }[];
};

type MissionDetailHeaderProps = {
  mission: MissionWithRelations;
  localScore: number;
  localBreakdown: ScoreBreakdownType["breakdown"] | null;
  isRecalculating: boolean;
  onRecalculate: (
    score: number,
    breakdown: ScoreBreakdownType["breakdown"],
  ) => void;
};

export function MissionDetailHeader({
  mission,
  localScore,
  isRecalculating,
  onRecalculate,
}: MissionDetailHeaderProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1">
        <ScoreRing score={localScore} size={40} />
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground rounded p-1 transition-colors"
          disabled={isRecalculating}
          onClick={async () => {
            try {
              const result = await resolveActionResult(
                recalculateScoreAction({ id: mission.id }),
              );
              onRecalculate(result.score, result.breakdown);
              toast.success(`Score recalculé : ${result.score}`);
            } catch (error) {
              toast.error(
                error instanceof Error ? error.message : "Erreur de recalcul",
              );
            }
          }}
        >
          <RefreshCw
            className={`size-3.5 ${isRecalculating ? "animate-spin" : ""}`}
          />
        </button>
      </div>
      <div className="flex-1">
        <SheetTitle className="text-lg">{mission.title}</SheetTitle>
        {mission.company && (
          <p className="text-muted-foreground flex items-center gap-1 text-sm">
            <Building2 className="size-3" />
            {mission.company}
          </p>
        )}
      </div>
      <StatusBadge status={mission.status} />
    </div>
  );
}
