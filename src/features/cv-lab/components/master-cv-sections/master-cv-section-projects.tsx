"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import type { MasterCvProject } from "../../cv-lab.schema";

type ProjectsSectionProps = {
  items: MasterCvProject[];
  onAdd: (section: string, item: Record<string, unknown>) => Promise<void>;
  onUpdate: (
    section: string,
    itemId: string,
    patch: Record<string, unknown>,
  ) => Promise<void>;
  onRemove: (section: string, itemId: string) => Promise<void>;
};

export function ProjectsSection({
  items,
  onAdd,
  onUpdate,
  onRemove,
}: ProjectsSectionProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editState, setEditState] = useState<
    Record<string, Partial<MasterCvProject>>
  >({});

  const getEditValue = (item: MasterCvProject) => ({
    ...item,
    ...editState[item.id],
  });

  const updateEdit = (id: string, patch: Partial<MasterCvProject>) => {
    setEditState((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...patch },
    }));
  };

  const handleSaveItem = async (item: MasterCvProject) => {
    const edit = editState[item.id] as Partial<MasterCvProject> | undefined;
    if (edit && Object.keys(edit).length > 0) {
      await onUpdate("projects", item.id, edit);
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
              <span>{current.name || "Nouveau projet"}</span>
            </button>
            {expandedId === item.id && (
              <div className="flex flex-col gap-3 border-t px-3 py-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="flex flex-col gap-1 sm:col-span-2">
                    <Label>Nom du projet *</Label>
                    <Input
                      value={current.name}
                      onChange={(e) =>
                        updateEdit(item.id, { name: e.target.value })
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-1 sm:col-span-2">
                    <Label>URL</Label>
                    <Input
                      value={current.url ?? ""}
                      placeholder="https://exemple.com"
                      onChange={(e) =>
                        updateEdit(item.id, { url: e.target.value })
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
                    onClick={async () => onRemove("projects", item.id)}
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
          onAdd("projects", { name: "Nouveau projet", description: "" })
        }
      >
        <Plus className="mr-1 size-3.5" />
        Ajouter un projet
      </Button>
    </div>
  );
}
