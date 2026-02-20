"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import type { MasterCvExperience } from "../../cv-lab.schema";

type ExperiencesSectionProps = {
  items: MasterCvExperience[];
  onAdd: (section: string, item: Record<string, unknown>) => Promise<void>;
  onUpdate: (
    section: string,
    itemId: string,
    patch: Record<string, unknown>,
  ) => Promise<void>;
  onRemove: (section: string, itemId: string) => Promise<void>;
};

export function ExperiencesSection({
  items,
  onAdd,
  onUpdate,
  onRemove,
}: ExperiencesSectionProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editState, setEditState] = useState<
    Record<string, Partial<MasterCvExperience>>
  >({});

  const getEditValue = (item: MasterCvExperience) => ({
    ...item,
    ...editState[item.id],
  });

  const updateEdit = (id: string, patch: Partial<MasterCvExperience>) => {
    setEditState((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...patch },
    }));
  };

  const handleSaveItem = async (item: MasterCvExperience) => {
    const edit = editState[item.id] as Partial<MasterCvExperience> | undefined;
    if (edit && Object.keys(edit).length > 0) {
      await onUpdate("experiences", item.id, edit);
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
                {current.title || current.company || "Nouvelle experience"}
              </span>
            </button>
            {expandedId === item.id && (
              <div className="flex flex-col gap-3 border-t px-3 py-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="flex flex-col gap-1">
                    <Label>Titre du poste *</Label>
                    <Input
                      value={current.title}
                      onChange={(e) =>
                        updateEdit(item.id, { title: e.target.value })
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label>Entreprise *</Label>
                    <Input
                      value={current.company}
                      onChange={(e) =>
                        updateEdit(item.id, { company: e.target.value })
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label>Date debut</Label>
                    <Input
                      value={current.startDate ?? ""}
                      placeholder="2020-01"
                      onChange={(e) =>
                        updateEdit(item.id, { startDate: e.target.value })
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label>Date fin</Label>
                    <Input
                      value={current.endDate ?? ""}
                      placeholder="2023-06"
                      onChange={(e) =>
                        updateEdit(item.id, { endDate: e.target.value })
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
                    onClick={async () => onRemove("experiences", item.id)}
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
          onAdd("experiences", { title: "", company: "", description: "" })
        }
      >
        <Plus className="mr-1 size-3.5" />
        Ajouter une experience
      </Button>
    </div>
  );
}
