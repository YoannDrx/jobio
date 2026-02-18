"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfileAction } from "@/features/profiles/profiles.action";
import {
  certificationSchema,
  type Certification,
} from "@/features/profiles/profiles.schema";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

type CvProfile = {
  id: string;
  certifications: unknown;
};

type CvSectionEditorCertificationsProps = {
  profile: CvProfile;
  onProfileSaved: () => Promise<void>;
};

const parseCertifications = (value: unknown): Certification[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => certificationSchema.safeParse(item))
    .filter((result) => result.success)
    .map((result) => result.data);
};

export function CvSectionEditorCertifications({
  profile,
  onProfileSaved,
}: CvSectionEditorCertificationsProps) {
  const [items, setItems] = useState<Certification[]>(() =>
    parseCertifications(profile.certifications),
  );
  const [expandedIndex, setExpandedIndex] = useState<number | null>(
    items.length > 0 ? 0 : null,
  );
  const [isSaving, setIsSaving] = useState(false);

  const updateItem = (index: number, patch: Partial<Certification>) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  };

  const addItem = () => {
    setItems((prev) => [...prev, { name: "", issuer: "", issueDate: "" }]);
    setExpandedIndex(items.length);
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
    setExpandedIndex(null);
  };

  const handleSave = async () => {
    const validated = z.array(certificationSchema).safeParse(items);
    if (!validated.success) {
      toast.error("Données invalides. Vérifiez les champs requis.");
      return;
    }
    setIsSaving(true);
    try {
      await resolveActionResult(
        updateProfileAction({
          id: profile.id,
          certifications: validated.data,
        }),
      );
      toast.success("Certifications sauvegardées");
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
        <div key={index} className="rounded-md border">
          <button
            type="button"
            className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-medium"
            onClick={() =>
              setExpandedIndex(expandedIndex === index ? null : index)
            }
          >
            <span>{item.name || `Certification ${index + 1}`}</span>
            {expandedIndex === index ? (
              <ChevronUp className="size-4" />
            ) : (
              <ChevronDown className="size-4" />
            )}
          </button>
          {expandedIndex === index ? (
            <div className="flex flex-col gap-3 border-t px-3 py-3">
              <div className="flex flex-col gap-1">
                <Label>Nom *</Label>
                <Input
                  value={item.name}
                  placeholder="AWS Solutions Architect"
                  onChange={(e) => updateItem(index, { name: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label>Organisme *</Label>
                <Input
                  value={item.issuer}
                  placeholder="Amazon Web Services"
                  onChange={(e) =>
                    updateItem(index, { issuer: e.target.value })
                  }
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label>Date d'obtention</Label>
                <Input
                  value={item.issueDate ?? ""}
                  placeholder="2023-03"
                  onChange={(e) =>
                    updateItem(index, { issueDate: e.target.value })
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
        Ajouter une certification
      </Button>
      <Button onClick={handleSave} disabled={isSaving}>
        {isSaving ? "Sauvegarde..." : "Sauvegarder les certifications"}
      </Button>
    </div>
  );
}
