"use client";

import { Badge } from "@/components/ui/badge";
import { ExternalLink, Clock, Monitor, MapPin, UserCircle } from "lucide-react";
import type { MissionWithRelations } from "./mission-detail-header";

type MissionDetailInfoProps = {
  mission: MissionWithRelations;
};

export function MissionDetailInfo({ mission }: MissionDetailInfoProps) {
  return (
    <>
      {/* Infos */}
      <div className="flex flex-wrap gap-3">
        {mission.tjm && (
          <Badge variant="outline" className="font-mono">
            {mission.tjm}€/j
          </Badge>
        )}
        {mission.duration && (
          <Badge variant="outline" className="gap-1">
            <Clock className="size-3" /> {mission.duration}
          </Badge>
        )}
        {mission.workType && (
          <Badge variant="outline" className="gap-1">
            <Monitor className="size-3" /> {mission.workType}
          </Badge>
        )}
        {mission.location && (
          <Badge variant="outline" className="gap-1">
            <MapPin className="size-3" /> {mission.location}
          </Badge>
        )}
        {mission.platform && (
          <Badge variant="secondary">{mission.platform.name}</Badge>
        )}
        {mission.profile && (
          <Badge variant="outline" className="gap-1">
            <UserCircle className="size-3" /> {mission.profile.name}
          </Badge>
        )}
      </div>

      {/* Description */}
      {mission.description && (
        <div className="flex flex-col gap-1">
          <h4 className="text-sm font-medium">Description</h4>
          <p className="text-muted-foreground text-sm">{mission.description}</p>
        </div>
      )}

      {/* Stack */}
      {mission.stack.length > 0 && (
        <div className="flex flex-col gap-1">
          <h4 className="text-sm font-medium">Stack</h4>
          <div className="flex flex-wrap gap-1">
            {mission.stack.map((tech) => (
              <Badge key={tech} variant="secondary" className="text-xs">
                {tech}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Source URL */}
      {mission.sourceUrl && (
        <a
          href={mission.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary flex items-center gap-1 text-sm hover:underline"
        >
          <ExternalLink className="size-3" />
          Voir l&apos;annonce originale
        </a>
      )}
    </>
  );
}
