"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateProfileAction } from "@/features/profiles/profiles.action";
import { updateCvLabDocumentAction } from "@/features/cv-lab/cv-lab.action";
import type { ContentOverrideItem } from "@/features/cv-lab/cv-lab.schema";
import {
  educationSchema,
  type Education,
} from "@/features/profiles/profiles.schema";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

type CvProfile = {
  id: string;
  education: unknown;
};

type CvSectionEditorEducationProps = {
  profile: CvProfile;
  onProfileSaved: () => Promise<void>;
  documentId?: string;
  overrides?: ContentOverrideItem[];
  onOverridesSaved?: () => Promise<void>;
};

const parseEducation = (value: unknown): Education[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => educationSchema.safeParse(item))
    .filter((result) => result.success)
    .map((result) => result.data);
};

export function CvSectionEditorEducation({
  profile,
  onProfileSaved,
  documentId,
  overrides,
  onOverridesSaved,
}: CvSectionEditorEducationProps) {
  const [items, setItems] = useState<Education[]>(() =>
    parseEducation(profile.education),
  );
  const [expandedIndex, setExpandedIndex] = useState<number | null>(
    items.length > 0 ? 0 : null,
  );
  const [isSaving, setIsSaving] = useState(false);

  const updateItem = (index: number, patch: Partial<Education>) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  };

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        degree: "",
        school: "",
        field: "",
        startDate: "",
        endDate: "",
        description: "",
      },
    ]);
    setExpandedIndex(items.length);
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
    setExpandedIndex(null);
  };

  const handleSave = async () => {
    const validated = z.array(educationSchema).safeParse(items);
    if (!validated.success) {
      toast.error("Données invalides. Vérifiez les champs requis.");
      return;
    }
    setIsSaving(true);
    try {
      if (documentId && onOverridesSaved) {
        const overrideItems: ContentOverrideItem[] = validated.data.map(
          (item, index) => ({
            masterItemId: `edu-${index}`,
            institution: item.school,
            degree: item.degree,
            field: item.field,
            description: item.description,
          }),
        );
        await resolveActionResult(
          updateCvLabDocumentAction({
            id: documentId,
            contentOverrides: {
              ...({} as Record<string, ContentOverrideItem[]>),
              education: overrideItems,
            },
          }),
        );
        toast.success("Formation sauvegardée (ce CV)");
        await onOverridesSaved();
      } else {
        await resolveActionResult(
          updateProfileAction({ id: profile.id, education: validated.data }),
        );
        toast.success("Formation sauvegardée");
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
              {item.degree || item.school || `Formation ${index + 1}`}
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
                <Label>Diplôme *</Label>
                <Input
                  value={item.degree}
                  placeholder="Master en informatique"
                  onChange={(e) =>
                    updateItem(index, { degree: e.target.value })
                  }
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label>Établissement *</Label>
                <Input
                  value={item.school}
                  placeholder="Université Paris-Saclay"
                  onChange={(e) =>
                    updateItem(index, { school: e.target.value })
                  }
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label>Domaine</Label>
                <Input
                  value={item.field ?? ""}
                  placeholder="Génie logiciel"
                  onChange={(e) => updateItem(index, { field: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <Label>Date début</Label>
                  <Input
                    value={item.startDate ?? ""}
                    placeholder="2018-09"
                    onChange={(e) =>
                      updateItem(index, { startDate: e.target.value })
                    }
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label>Date fin</Label>
                  <Input
                    value={item.endDate ?? ""}
                    placeholder="2020-06"
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
        Ajouter une formation
      </Button>
      <Button onClick={handleSave} disabled={isSaving}>
        {isSaving ? "Sauvegarde..." : "Sauvegarder la formation"}
      </Button>
    </div>
  );
}
