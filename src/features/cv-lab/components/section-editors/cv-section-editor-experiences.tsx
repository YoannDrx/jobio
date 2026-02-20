"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateProfileAction } from "@/features/profiles/profiles.action";
import { updateCvLabDocumentAction } from "@/features/cv-lab/cv-lab.action";
import type { ContentOverrideItem } from "@/features/cv-lab/cv-lab.schema";
import {
  experienceSchema,
  type Experience,
} from "@/features/profiles/profiles.schema";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

type CvProfile = {
  id: string;
  experiences: unknown;
};

type CvSectionEditorExperiencesProps = {
  profile: CvProfile;
  onProfileSaved: () => Promise<void>;
  documentId?: string;
  overrides?: ContentOverrideItem[];
  onOverridesSaved?: () => Promise<void>;
};

const parseExperiences = (value: unknown): Experience[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => experienceSchema.safeParse(item))
    .filter((result) => result.success)
    .map((result) => result.data);
};

export function CvSectionEditorExperiences({
  profile,
  onProfileSaved,
  documentId,
  overrides,
  onOverridesSaved,
}: CvSectionEditorExperiencesProps) {
  const [items, setItems] = useState<Experience[]>(() =>
    parseExperiences(profile.experiences),
  );
  const [expandedIndex, setExpandedIndex] = useState<number | null>(
    items.length > 0 ? 0 : null,
  );
  const [isSaving, setIsSaving] = useState(false);

  const updateItem = (index: number, patch: Partial<Experience>) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  };

  const addItem = () => {
    const newItem: Experience = {
      title: "",
      company: "",
      startDate: "",
      endDate: "",
      description: "",
    };
    setItems((prev) => [...prev, newItem]);
    setExpandedIndex(items.length);
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
    setExpandedIndex(null);
  };

  const handleSave = async () => {
    const validated = z.array(experienceSchema).safeParse(items);
    if (!validated.success) {
      toast.error("Donnees invalides. Verifiez les champs requis.");
      return;
    }
    setIsSaving(true);
    try {
      if (documentId && onOverridesSaved) {
        const overrideItems: ContentOverrideItem[] = validated.data.map(
          (item, index) => ({
            masterItemId: `exp-${index}`,
            title: item.title,
            company: item.company,
            description: item.description,
          }),
        );
        await resolveActionResult(
          updateCvLabDocumentAction({
            id: documentId,
            contentOverrides: {
              ...({} as Record<string, ContentOverrideItem[]>),
              experiences: overrideItems,
            },
          }),
        );
        toast.success("Experiences sauvegardees (ce CV)");
        await onOverridesSaved();
      } else {
        await resolveActionResult(
          updateProfileAction({
            id: profile.id,
            experiences: validated.data,
          }),
        );
        toast.success("Experiences sauvegardees");
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
        <div key={index} className="rounded-md border">
          <button
            type="button"
            className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-medium"
            onClick={() =>
              setExpandedIndex(expandedIndex === index ? null : index)
            }
          >
            <span>
              {item.title || item.company || `Experience ${index + 1}`}
            </span>
            {expandedIndex === index ? (
              <ChevronUp className="size-4" />
            ) : (
              <ChevronDown className="size-4" />
            )}
          </button>
          {expandedIndex === index ? (
            <div className="flex flex-col gap-3 border-t px-3 py-3">
              <div className="flex flex-col gap-1">
                <Label>Titre du poste *</Label>
                <Input
                  value={item.title}
                  placeholder="Senior Developer"
                  onChange={(e) => updateItem(index, { title: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label>Entreprise *</Label>
                <Input
                  value={item.company}
                  placeholder="Acme Corp"
                  onChange={(e) =>
                    updateItem(index, { company: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <Label>Date debut</Label>
                  <Input
                    value={item.startDate ?? ""}
                    placeholder="2020-01"
                    onChange={(e) =>
                      updateItem(index, { startDate: e.target.value })
                    }
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label>Date fin</Label>
                  <Input
                    value={item.endDate ?? ""}
                    placeholder="2023-06"
                    onChange={(e) =>
                      updateItem(index, { endDate: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <Label>Description</Label>
                <Textarea
                  value={item.description ?? ""}
                  rows={3}
                  onChange={(e) =>
                    updateItem(index, { description: e.target.value })
                  }
                />
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => removeItem(index)}
              >
                <Trash2 className="mr-1 size-3.5" />
                Supprimer
              </Button>
            </div>
          ) : null}
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addItem}>
        <Plus className="mr-1 size-3.5" />
        Ajouter une experience
      </Button>
      <Button onClick={handleSave} disabled={isSaving}>
        {isSaving ? "Sauvegarde..." : "Sauvegarder les experiences"}
      </Button>
    </div>
  );
}
