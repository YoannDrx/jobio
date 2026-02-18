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
import {
  languageSchema,
  type Language,
} from "@/features/profiles/profiles.schema";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

type CvProfile = {
  id: string;
  languages: unknown;
};

type CvSectionEditorLanguagesProps = {
  profile: CvProfile;
  onProfileSaved: () => Promise<void>;
};

const LANGUAGE_LEVEL_LABELS: Record<string, string> = {
  BEGINNER: "Débutant",
  INTERMEDIATE: "Intermédiaire",
  ADVANCED: "Avancé",
  FLUENT: "Courant",
};

const LANGUAGE_LEVELS = [
  "BEGINNER",
  "INTERMEDIATE",
  "ADVANCED",
  "FLUENT",
] as const;

const parseLanguages = (value: unknown): Language[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => languageSchema.safeParse(item))
    .filter((result) => result.success)
    .map((result) => result.data);
};

export function CvSectionEditorLanguages({
  profile,
  onProfileSaved,
}: CvSectionEditorLanguagesProps) {
  const [items, setItems] = useState<Language[]>(() =>
    parseLanguages(profile.languages),
  );
  const [isSaving, setIsSaving] = useState(false);

  const updateItem = (index: number, patch: Partial<Language>) => {
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
    const validated = z.array(languageSchema).safeParse(items);
    if (!validated.success) {
      toast.error("Données invalides. Vérifiez les champs requis.");
      return;
    }
    setIsSaving(true);
    try {
      await resolveActionResult(
        updateProfileAction({ id: profile.id, languages: validated.data }),
      );
      toast.success("Langues sauvegardées");
      await onProfileSaved();
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
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <Input
            value={item.name}
            placeholder="Français, Anglais..."
            className="flex-1"
            onChange={(e) => updateItem(index, { name: e.target.value })}
          />
          <Select
            value={item.level}
            onValueChange={(value) =>
              updateItem(index, { level: value as Language["level"] })
            }
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGE_LEVELS.map((level) => (
                <SelectItem key={level} value={level}>
                  {LANGUAGE_LEVEL_LABELS[level]}
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
        Ajouter une langue
      </Button>
      <Button onClick={handleSave} disabled={isSaving}>
        {isSaving ? "Sauvegarde..." : "Sauvegarder les langues"}
      </Button>
    </div>
  );
}
