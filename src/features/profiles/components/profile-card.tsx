"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  Skill,
  Experience,
  Education,
  Language,
  Project,
} from "@/features/profiles/profiles.schema";
import { formatDateFr } from "@/lib/format-date-fr";
import { Pencil, Trash2, Globe } from "lucide-react";
import Link from "next/link";

type ProfileCardProps = {
  name: string;
  headline: string;
  skills: Skill[] | null;
  experiences: Experience[] | null;
  education: Education[] | null;
  languages: Language[] | null;
  projects: Project[] | null;
  tjmTarget?: number | null;
  workTypePreference?: string | null;
  isDefault: boolean;
  portalSlug?: string | null;
  onEdit?: () => void;
  onDelete?: () => void;
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
  experiences,
  education,
  languages,
  projects,
  tjmTarget,
  workTypePreference,
  isDefault,
  portalSlug,
  onEdit,
  onDelete,
}: ProfileCardProps) {
  const skillsArray = (skills ?? []) as Skill[];
  const firstThreeSkills = skillsArray.slice(0, 3);
  const remainingCount = Math.max(0, skillsArray.length - 3);
  const experiencesArray = (experiences ?? []) as Experience[];
  const educationArray = (education ?? []) as Education[];
  const languagesArray = (languages ?? []) as Language[];
  const firstThreeLanguages = languagesArray.slice(0, 3);
  const remainingLanguagesCount = Math.max(0, languagesArray.length - 3);
  const projectsArray = (projects ?? []) as Project[];

  return (
    <Card className="relative">
      {(onEdit ?? onDelete) && (
        <div className="absolute top-2 right-2 flex gap-0.5">
          {onEdit && (
            <Button variant="ghost" size="icon-xs" onClick={onEdit}>
              <Pencil className="size-3.5" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={onDelete}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="size-3.5" />
            </Button>
          )}
        </div>
      )}
      <CardHeader>
        <div>
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">{name}</CardTitle>
            {isDefault && (
              <Badge className="border-none bg-cyan-500/10 text-xs text-cyan-600 dark:text-cyan-400">
                Défaut
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-1 text-sm">{headline}</p>
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

        {experiencesArray.length > 0 && (
          <div className="flex flex-col gap-1">
            <p className="text-muted-foreground text-sm font-medium">
              {experiencesArray.length} expérience
              {experiencesArray.length > 1 ? "s" : ""}
            </p>
            {experiencesArray.map((exp, i) => (
              <div
                key={i}
                className="text-muted-foreground flex items-center gap-2 text-xs"
              >
                <span>
                  {exp.title}
                  {exp.company ? ` - ${exp.company}` : ""}
                </span>
                {exp.startDate && (
                  <span>
                    {formatDateFr(exp.startDate)}
                    {exp.endDate ? ` - ${formatDateFr(exp.endDate)}` : ""}
                  </span>
                )}
                {!exp.endDate && (
                  <Badge className="border-none bg-green-500/10 text-xs text-green-600 dark:text-green-400">
                    En poste
                  </Badge>
                )}
              </div>
            ))}
          </div>
        )}

        {educationArray.length > 0 && (
          <p className="text-muted-foreground text-sm">
            {educationArray.length} formation
            {educationArray.length > 1 ? "s" : ""}
          </p>
        )}

        {projectsArray.length > 0 && (
          <div className="flex flex-col gap-1">
            <p className="text-muted-foreground text-sm font-medium">
              {projectsArray.length} projet
              {projectsArray.length > 1 ? "s" : ""}
            </p>
            {projectsArray.map((proj, i) => (
              <div
                key={i}
                className="text-muted-foreground flex items-center gap-2 text-xs"
              >
                <span>{proj.name}</span>
                {proj.startDate && (
                  <span>
                    {formatDateFr(proj.startDate)}
                    {proj.endDate ? ` - ${formatDateFr(proj.endDate)}` : ""}
                  </span>
                )}
                {!proj.endDate && (
                  <Badge className="border-none bg-green-500/10 text-xs text-green-600 dark:text-green-400">
                    En cours
                  </Badge>
                )}
              </div>
            ))}
          </div>
        )}

        {languagesArray.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {firstThreeLanguages.map((lang) => (
              <Badge key={lang.name} variant="secondary" className="text-xs">
                {lang.name}
              </Badge>
            ))}
            {remainingLanguagesCount > 0 && (
              <Badge variant="outline" className="text-xs">
                +{remainingLanguagesCount}
              </Badge>
            )}
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

        {portalSlug && (
          <Button variant="outline" size="sm" asChild>
            <Link href={`/p/${portalSlug}`} target="_blank" rel="noopener noreferrer">
              <Globe className="mr-2 size-4" />
              Voir ma page publique
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
