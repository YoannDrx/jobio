"use client";

import { Badge } from "@/components/ui/badge";
import {
  MISSION_STATUS_LABELS,
  type MissionStatusValue,
} from "@/features/missions/mission-status";
import { cn } from "@/lib/utils";

const MISSION_STATUS_CONFIG: Record<
  MissionStatusValue,
  { label: string; className: string }
> = {
  A_POSTULER: {
    label: MISSION_STATUS_LABELS.A_POSTULER,
    className: "bg-status-info/15 text-status-info border-status-info/30",
  },
  POSTULE: {
    label: MISSION_STATUS_LABELS.POSTULE,
    className:
      "bg-status-warning/15 text-status-warning border-status-warning/30",
  },
  ENTRETIEN: {
    label: MISSION_STATUS_LABELS.ENTRETIEN,
    className: "bg-status-hot/15 text-status-hot border-status-hot/30",
  },
  PROPOSITION: {
    label: MISSION_STATUS_LABELS.PROPOSITION,
    className: "bg-purple-500/15 text-purple-500 border-purple-500/30",
  },
  ACCEPTE: {
    label: MISSION_STATUS_LABELS.ACCEPTE,
    className:
      "bg-status-success/15 text-status-success border-status-success/30",
  },
  REFUSE: {
    label: MISSION_STATUS_LABELS.REFUSE,
    className: "bg-status-danger/15 text-status-danger border-status-danger/30",
  },
  EN_PAUSE: {
    label: MISSION_STATUS_LABELS.EN_PAUSE,
    className: "bg-blue-500/15 text-blue-500 border-blue-500/30",
  },
  ABANDONNE: {
    label: MISSION_STATUS_LABELS.ABANDONNE,
    className: "bg-gray-600/15 text-gray-400 border-gray-600/30",
  },
  ARCHIVE: {
    label: MISSION_STATUS_LABELS.ARCHIVE,
    className:
      "bg-status-neutral/15 text-status-neutral border-status-neutral/30",
  },
};

type MissionStatus = MissionStatusValue;

export function StatusBadge({
  status,
  className,
}: {
  status: MissionStatus;
  className?: string;
}) {
  const config = MISSION_STATUS_CONFIG[status];
  return (
    <Badge variant="outline" className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}

export { MISSION_STATUS_CONFIG };
export type { MissionStatus };
