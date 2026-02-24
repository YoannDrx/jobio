"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import type { MasterCvProject } from "../../cv-lab.schema";
import { TagInput } from "../tag-input";
import { DraggableItemList } from "../draggable-item-list";
import { AiRewritePopover } from "../ai-rewrite-popover";
import { FieldError } from "../field-error";

type ProjectsSectionProps = {
  items: MasterCvProject[];
  onAdd: (section: string, item: Record<string, unknown>) => Promise<void>;
  onUpdate: (
    section: string,
    itemId: string,
    patch: Record<string, unknown>,
  ) => Promise<void>;
  onRemove: (section: string, itemId: string) => Promise<void>;
  onReorder: (section: string, itemIds: string[]) => Promise<void>;
};

export function ProjectsSection({
  items,
  onAdd,
  onUpdate,
  onRemove,
  onReorder,
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

  const getItemErrors = (item: { name: string }) => ({
    name: item.name.trim().length === 0 ? "Le nom du projet est requis" : null,
  });

  useEffect(() => {
    const itemId = expandedId;
    if (!itemId) return;
    if (!(itemId in editState)) return;
    const edit = editState[itemId];
    if (Object.keys(edit).length === 0) return;

    // Validate before saving
    const item = items.find((i) => i.id === itemId);
    if (item) {
      const merged = { ...item, ...edit };
      const itemErrors = getItemErrors(merged as MasterCvProject);
      if (Object.values(itemErrors).some(Boolean)) return;
    }

    const timer = setTimeout(() => {
      void onUpdate("projects", itemId, edit);
      setEditState((prev) => {
        const { [itemId]: _, ...rest } = prev;
        return rest;
      });
    }, 1500);

    return () => clearTimeout(timer);
  }, [editState, expandedId, items, onUpdate]);

  return (
    <div className="flex flex-col gap-3">
      <DraggableItemList
        droppableId="projects-list"
        items={items}
        onReorder={async (newItemIds) => onReorder("projects", newItemIds)}
        renderItem={(item) => {
          const current = getEditValue(item);
          const itemErrors = getItemErrors(current);
          return (
            <>
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
                      <FieldError message={itemErrors.name} />
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
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="flex flex-col gap-1">
                      <Label>Role</Label>
                      <Input
                        value={current.role ?? ""}
                        placeholder="Lead dev / Solo"
                        onChange={(e) =>
                          updateEdit(item.id, { role: e.target.value })
                        }
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label>Date debut</Label>
                      <Input
                        value={current.startDate ?? ""}
                        placeholder="janvier 2024"
                        onChange={(e) =>
                          updateEdit(item.id, { startDate: e.target.value })
                        }
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label>Date fin</Label>
                      <Input
                        value={current.endDate ?? ""}
                        placeholder="juin 2025"
                        onChange={(e) =>
                          updateEdit(item.id, { endDate: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label>Statut</Label>
                    <Input
                      value={current.status ?? ""}
                      placeholder="En cours / Termine"
                      onChange={(e) =>
                        updateEdit(item.id, { status: e.target.value })
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1">
                      <Label>Description</Label>
                      <AiRewritePopover
                        text={current.description ?? ""}
                        onAccept={(val) =>
                          updateEdit(item.id, { description: val })
                        }
                        context={{ jobTitle: current.name }}
                      />
                    </div>
                    <Textarea
                      value={current.description ?? ""}
                      rows={3}
                      onChange={(e) =>
                        updateEdit(item.id, { description: e.target.value })
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label>Technologies</Label>
                    <TagInput
                      tags={current.technologies ?? []}
                      onChange={(tags) =>
                        updateEdit(item.id, { technologies: tags })
                      }
                      placeholder="Ajouter une technologie"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label>Points forts / Impact</Label>
                    <TagInput
                      tags={current.highlights ?? []}
                      onChange={(tags) =>
                        updateEdit(item.id, { highlights: tags })
                      }
                      placeholder="Ajouter un point fort"
                    />
                  </div>
                  <div className="flex gap-2">
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
            </>
          );
        }}
      />
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
