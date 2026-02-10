"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const MISSION_STATUS_CONFIG = {
  A_POSTULER: {
    label: "À postuler",
    className: "bg-status-info/15 text-status-info border-status-info/30",
  },
  POSTULE: {
    label: "Postulé",
    className:
      "bg-status-warning/15 text-status-warning border-status-warning/30",
  },
  ENTRETIEN: {
    label: "Entretien",
    className: "bg-status-hot/15 text-status-hot border-status-hot/30",
  },
  PROPOSITION: {
    label: "Proposition",
    className: "bg-purple-500/15 text-purple-500 border-purple-500/30",
  },
  ACCEPTE: {
    label: "Accepté",
    className:
      "bg-status-success/15 text-status-success border-status-success/30",
  },
  REFUSE: {
    label: "Refusé",
    className: "bg-status-danger/15 text-status-danger border-status-danger/30",
  },
  EN_PAUSE: {
    label: "En pause",
    className: "bg-blue-500/15 text-blue-500 border-blue-500/30",
  },
  ABANDONNE: {
    label: "Abandonné",
    className: "bg-gray-600/15 text-gray-400 border-gray-600/30",
  },
  ARCHIVE: {
    label: "Archivé",
    className:
      "bg-status-neutral/15 text-status-neutral border-status-neutral/30",
  },
} as const;

type MissionStatus = keyof typeof MISSION_STATUS_CONFIG;

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
