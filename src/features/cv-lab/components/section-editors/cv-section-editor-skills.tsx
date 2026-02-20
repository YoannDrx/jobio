"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateProfileAction } from "@/features/profiles/profiles.action";
import { updateCvLabDocumentAction } from "@/features/cv-lab/cv-lab.action";
import type { ContentOverrideItem } from "@/features/cv-lab/cv-lab.schema";
import { skillSchema, type Skill } from "@/features/profiles/profiles.schema";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

type CvProfile = {
  id: string;
  skills: unknown;
};

type CvSectionEditorSkillsProps = {
  profile: CvProfile;
  onProfileSaved: () => Promise<void>;
  documentId?: string;
  overrides?: ContentOverrideItem[];
  onOverridesSaved?: () => Promise<void>;
};

const SKILL_LEVEL_LABELS: Record<string, string> = {
  BEGINNER: "Débutant",
  INTERMEDIATE: "Intermédiaire",
  ADVANCED: "Avancé",
  EXPERT: "Expert",
};

const SKILL_LEVELS = [
  "BEGINNER",
  "INTERMEDIATE",
  "ADVANCED",
  "EXPERT",
] as const;

const parseSkills = (value: unknown): Skill[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => skillSchema.safeParse(item))
    .filter((result) => result.success)
    .map((result) => result.data);
};

export function CvSectionEditorSkills({
  profile,
  onProfileSaved,
  documentId,
  overrides,
  onOverridesSaved,
}: CvSectionEditorSkillsProps) {
  const [items, setItems] = useState<Skill[]>(() =>
    parseSkills(profile.skills),
  );
  const [isSaving, setIsSaving] = useState(false);

  const updateItem = (index: number, patch: Partial<Skill>) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  };

  const addItem = () => {
    setItems((prev) => [...prev, { name: "", level: "INTERMEDIATE" as const }]);
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    const validated = z.array(skillSchema).safeParse(items);
    if (!validated.success) {
      toast.error("Données invalides. Vérifiez les champs requis.");
      return;
    }
    setIsSaving(true);
    try {
      if (documentId && onOverridesSaved) {
        const overrideItems: ContentOverrideItem[] = validated.data.map(
          (item, index) => ({
            masterItemId: `skill-${index}`,
            name: item.name,
            level: item.level,
          }),
        );
        await resolveActionResult(
          updateCvLabDocumentAction({
            id: documentId,
            contentOverrides: {
              ...({} as Record<string, ContentOverrideItem[]>),
              skills: overrideItems,
            },
          }),
        );
        toast.success("Compétences sauvegardées (ce CV)");
        await onOverridesSaved();
      } else {
        await resolveActionResult(
          updateProfileAction({ id: profile.id, skills: validated.data }),
        );
        toast.success("Compétences sauvegardées");
        await onProfileSaved();
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur de sauvegarde",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {overrides && overrides.length > 0 && (
        <p className="text-muted-foreground text-xs">
          {overrides.length} override(s) applique(s) sur ce CV.
        </p>
      )}
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <div className="flex flex-1 flex-col gap-1">
            <Input
              value={item.name}
              placeholder="Nom de la compétence"
              onChange={(e) => updateItem(index, { name: e.target.value })}
            />
          </div>
          <Select
            value={item.level}
            onValueChange={(value) =>
              updateItem(index, {
                level: value as Skill["level"],
              })
            }
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SKILL_LEVELS.map((level) => (
                <SelectItem key={level} value={level}>
                  {SKILL_LEVEL_LABELS[level]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => removeItem(index)}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addItem}>
        <Plus className="mr-1 size-3.5" />
        Ajouter une compétence
      </Button>
      <Button onClick={handleSave} disabled={isSaving}>
        {isSaving ? "Sauvegarde..." : "Sauvegarder les compétences"}
      </Button>
    </div>
  );
}
