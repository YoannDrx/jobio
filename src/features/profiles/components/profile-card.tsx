"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import type { Skill } from "@/features/profiles/profiles.schema";

type ProfileCardProps = {
  name: string;
  headline: string;
  skills: Skill[] | null;
  tjmTarget?: number | null;
  workTypePreference?: string | null;
  isDefault: boolean;
};

const WORK_TYPE_LABELS: Record<string, string> = {
  REMOTE: "Remote",
  HYBRID: "Hybride",
  ONSITE: "Sur site",
};

export function ProfileCard({
  name,
  headline,
  skills,
  tjmTarget,
  workTypePreference,
  isDefault,
}: ProfileCardProps) {
  const skillsArray = (skills ?? []) as Skill[];
  const firstThreeSkills = skillsArray.slice(0, 3);
  const remainingCount = Math.max(0, skillsArray.length - 3);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-lg">{name}</CardTitle>
            <p className="text-muted-foreground mt-1 text-sm">{headline}</p>
          </div>
          {isDefault && <Badge variant="default">Défaut</Badge>}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {skillsArray.length > 0 && (
          <div>
            <p className="text-muted-foreground mb-2 block text-sm">
              {skillsArray.length} compétence{skillsArray.length > 1 ? "s" : ""}
            </p>
            <div className="flex flex-wrap gap-1">
              {firstThreeSkills.map((skill) => (
                <Badge key={skill.name} variant="secondary" className="text-xs">
                  {skill.name}
                </Badge>
              ))}
              {remainingCount > 0 && (
                <Badge variant="outline" className="text-xs">
                  +{remainingCount}
                </Badge>
              )}
            </div>
          </div>
        )}

        {tjmTarget && (
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm">{tjmTarget}€/j</span>
          </div>
        )}

        {workTypePreference && (
          <Badge variant="outline" className="w-fit text-xs">
            {WORK_TYPE_LABELS[workTypePreference] ?? workTypePreference}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}
