"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import type { MasterCvEducation } from "../../cv-lab.schema";
import { DraggableItemList } from "../draggable-item-list";
import { RichTextEditor } from "../rich-text-editor";
import { AiRewritePopover } from "../ai-rewrite-popover";

type EducationSectionProps = {
  items: MasterCvEducation[];
  onAdd: (section: string, item: Record<string, unknown>) => Promise<void>;
  onUpdate: (
    section: string,
    itemId: string,
    patch: Record<string, unknown>,
  ) => Promise<void>;
  onRemove: (section: string, itemId: string) => Promise<void>;
  onReorder: (section: string, itemIds: string[]) => Promise<void>;
};

export function EducationSection({
  items,
  onAdd,
  onUpdate,
  onRemove,
  onReorder,
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

  useEffect(() => {
    const itemId = expandedId;
    if (!itemId) return;
    if (!(itemId in editState)) return;
    const edit = editState[itemId];
    if (Object.keys(edit).length === 0) return;

    const timer = setTimeout(() => {
      void onUpdate("education", itemId, edit);
      setEditState((prev) => {
        const { [itemId]: _, ...rest } = prev;
        return rest;
      });
    }, 1500);

    return () => clearTimeout(timer);
  }, [editState, expandedId, onUpdate]);

  return (
    <div className="flex flex-col gap-3">
      <DraggableItemList
        droppableId="education-list"
        items={items}
        onReorder={async (newItemIds) => onReorder("education", newItemIds)}
        renderItem={(item) => {
          const current = getEditValue(item);
          return (
            <>
              <button
                type="button"
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-medium"
                onClick={() =>
                  setExpandedId(expandedId === item.id ? null : item.id)
                }
              >
                <span>
                  {current.institution ||
                    current.degree ||
                    "Nouvelle formation"}
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
                    <div className="flex items-center gap-1">
                      <Label>Description</Label>
                      <AiRewritePopover
                        text={current.description ?? ""}
                        onAccept={(val) =>
                          updateEdit(item.id, { description: val })
                        }
                        context={{ jobTitle: current.degree }}
                      />
                    </div>
                    <RichTextEditor
                      value={current.description ?? ""}
                      onChange={(val) =>
                        updateEdit(item.id, { description: val })
                      }
                    />
                  </div>
                  <div className="flex gap-2">
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
            </>
          );
        }}
      />
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
