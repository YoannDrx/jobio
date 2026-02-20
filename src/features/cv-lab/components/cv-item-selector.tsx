"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Pencil, X } from "lucide-react";
import type {
  ContentOverrideItem,
  MasterCvCertification,
  MasterCvEducation,
  MasterCvExperience,
  MasterCvLanguage,
  MasterCvProject,
  MasterCvSection,
  MasterCvSkill,
} from "../cv-lab.schema";

type CvItemSelectorProps = {
  section: MasterCvSection;
  masterItems: { id: string }[];
  hiddenItemIds: string[];
  overrides: ContentOverrideItem[];
  onToggleItem: (itemId: string, visible: boolean) => void;
  onUpdateOverride: (itemId: string, patch: Record<string, unknown>) => void;
  onRemoveOverride: (itemId: string) => void;
};

const getItemSummary = (
  section: MasterCvSection,
  item: { id: string },
): { title: string; subtitle: string | null } => {
  switch (section) {
    case "experiences": {
      const exp = item as MasterCvExperience;
      return {
        title: exp.title,
        subtitle: exp.company,
      };
    }
    case "skills": {
      const skill = item as MasterCvSkill;
      return {
        title: skill.name,
        subtitle: skill.level ?? null,
      };
    }
    case "education": {
      const edu = item as MasterCvEducation;
      return {
        title: edu.degree,
        subtitle: edu.institution,
      };
    }
    case "projects": {
      const project = item as MasterCvProject;
      return {
        title: project.name,
        subtitle: project.description ?? null,
      };
    }
    case "languages": {
      const lang = item as MasterCvLanguage;
      return {
        title: lang.name,
        subtitle: lang.level,
      };
    }
    case "certifications": {
      const cert = item as MasterCvCertification;
      return {
        title: cert.name,
        subtitle: cert.issuer ?? null,
      };
    }
  }
};

export function CvItemSelector({
  section,
  masterItems,
  hiddenItemIds,
  overrides,
  onToggleItem,
  onUpdateOverride,
  onRemoveOverride,
}: CvItemSelectorProps) {
  const hiddenSet = new Set(hiddenItemIds);
  const overrideMap = new Map(overrides.map((o) => [o.masterItemId, o]));

  if (masterItems.length === 0) {
    return (
      <p className="text-muted-foreground py-4 text-center text-sm">
        Aucun item dans cette section.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {masterItems.map((item) => {
        const isVisible = !hiddenSet.has(item.id);
        const override = overrideMap.get(item.id);
        const hasOverride = Boolean(override);
        const { title, subtitle } = getItemSummary(section, item);

        return (
          <div
            key={item.id}
            className="flex items-center justify-between gap-3 rounded-md border px-3 py-2"
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <Switch
                checked={isVisible}
                onCheckedChange={(checked) =>
                  onToggleItem(item.id, Boolean(checked))
                }
              />
              <div className="flex flex-col gap-0.5 overflow-hidden">
                <span className="truncate text-sm font-medium">{title}</span>
                {subtitle ? (
                  <span className="text-muted-foreground truncate text-xs">
                    {subtitle}
                  </span>
                ) : null}
              </div>
              {hasOverride ? (
                <Badge variant="secondary" className="shrink-0">
                  Personnalise
                </Badge>
              ) : null}
            </div>
            <div className="flex shrink-0 gap-1">
              <Button
                size="icon-xs"
                variant="ghost"
                title="Editer l'override"
                onClick={() => onUpdateOverride(item.id, {})}
              >
                <Pencil className="size-3" />
              </Button>
              {hasOverride ? (
                <Button
                  size="icon-xs"
                  variant="ghost"
                  title="Supprimer l'override"
                  onClick={() => onRemoveOverride(item.id)}
                >
                  <X className="size-3" />
                </Button>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
