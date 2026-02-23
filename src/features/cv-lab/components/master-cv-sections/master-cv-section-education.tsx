"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import type { MasterCvEducation } from "../../cv-lab.schema";

type EducationSectionProps = {
  items: MasterCvEducation[];
  onAdd: (section: string, item: Record<string, unknown>) => Promise<void>;
  onUpdate: (
    section: string,
    itemId: string,
    patch: Record<string, unknown>,
  ) => Promise<void>;
  onRemove: (section: string, itemId: string) => Promise<void>;
};

export function EducationSection({
  items,
  onAdd,
  onUpdate,
  onRemove,
}: EducationSectionProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editState, setEditState] = useState<
    Record<string, Partial<MasterCvEducation>>
  >({});

  const getEditValue = (item: MasterCvEducation) => ({
    ...item,
    ...editState[item.id],
  });

  const updateEdit = (id: string, patch: Partial<MasterCvEducation>) => {
    setEditState((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...patch },
    }));
  };

  const handleSaveItem = async (item: MasterCvEducation) => {
    const edit = editState[item.id] as Partial<MasterCvEducation> | undefined;
    if (edit && Object.keys(edit).length > 0) {
      await onUpdate("education", item.id, edit);
      setEditState((prev) => {
        const { [item.id]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => {
        const current = getEditValue(item);
        return (
          <div key={item.id} className="rounded-md border">
            <button
              type="button"
              className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-medium"
              onClick={() =>
                setExpandedId(expandedId === item.id ? null : item.id)
              }
            >
              <span>
                {current.institution || current.degree || "Nouvelle formation"}
              </span>
            </button>
            {expandedId === item.id && (
              <div className="flex flex-col gap-3 border-t px-3 py-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="flex flex-col gap-1">
                    <Label>Diplome / Certification *</Label>
                    <Input
                      value={current.degree}
                      onChange={(e) =>
                        updateEdit(item.id, { degree: e.target.value })
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label>Etablissement *</Label>
                    <Input
                      value={current.institution}
                      onChange={(e) =>
                        updateEdit(item.id, { institution: e.target.value })
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label>Date debut</Label>
                    <Input
                      value={current.startDate ?? ""}
                      placeholder="septembre 2018"
                      onChange={(e) =>
                        updateEdit(item.id, { startDate: e.target.value })
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label>Date fin</Label>
                    <Input
                      value={current.endDate ?? ""}
                      placeholder="juin 2020"
                      onChange={(e) =>
                        updateEdit(item.id, { endDate: e.target.value })
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label>Specialisation</Label>
                    <Input
                      value={current.field ?? ""}
                      placeholder="Informatique"
                      onChange={(e) =>
                        updateEdit(item.id, { field: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <Label>Description</Label>
                  <Textarea
                    value={current.description ?? ""}
                    rows={3}
                    onChange={(e) =>
                      updateEdit(item.id, { description: e.target.value })
                    }
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={async () => handleSaveItem(item)}
                    disabled={!editState[item.id]}
                  >
                    Sauvegarder
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={async () => onRemove("education", item.id)}
                  >
                    <Trash2 className="mr-1 size-3.5" />
                    Supprimer
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
      })}
      <Button
        variant="outline"
        size="sm"
        onClick={async () =>
          onAdd("education", {
            degree: "Nouveau diplome",
            institution: "Etablissement",
            description: "",
          })
        }
      >
        <Plus className="mr-1 size-3.5" />
        Ajouter une formation
      </Button>
    </div>
  );
}
