"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import type { MasterCvCertification } from "../../cv-lab.schema";
import { DraggableItemList } from "../draggable-item-list";

type CertificationsSectionProps = {
  items: MasterCvCertification[];
  onAdd: (section: string, item: Record<string, unknown>) => Promise<void>;
  onUpdate: (
    section: string,
    itemId: string,
    patch: Record<string, unknown>,
  ) => Promise<void>;
  onRemove: (section: string, itemId: string) => Promise<void>;
  onReorder: (section: string, itemIds: string[]) => Promise<void>;
};

export function CertificationsSection({
  items,
  onAdd,
  onUpdate,
  onRemove,
  onReorder,
}: CertificationsSectionProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editState, setEditState] = useState<
    Record<string, Partial<MasterCvCertification>>
  >({});

  const getEditValue = (item: MasterCvCertification) => ({
    ...item,
    ...editState[item.id],
  });

  const updateEdit = (id: string, patch: Partial<MasterCvCertification>) => {
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
      void onUpdate("certifications", itemId, edit);
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
        droppableId="certifications-list"
        items={items}
        onReorder={async (newItemIds) =>
          onReorder("certifications", newItemIds)
        }
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
                  {(current.name || current.issuer) ?? "Nouvelle certification"}
                </span>
              </button>
              {expandedId === item.id && (
                <div className="flex flex-col gap-3 border-t px-3 py-3">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="flex flex-col gap-1">
                      <Label>Nom de la certification *</Label>
                      <Input
                        value={current.name}
                        onChange={(e) =>
                          updateEdit(item.id, { name: e.target.value })
                        }
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label>Organisme</Label>
                      <Input
                        value={current.issuer ?? ""}
                        onChange={(e) =>
                          updateEdit(item.id, { issuer: e.target.value })
                        }
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label>Date</Label>
                      <Input
                        value={current.date ?? ""}
                        placeholder="juin 2023"
                        onChange={(e) =>
                          updateEdit(item.id, { date: e.target.value })
                        }
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label>Lien</Label>
                      <Input
                        value={current.url ?? ""}
                        placeholder="https://..."
                        onChange={(e) =>
                          updateEdit(item.id, { url: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={async () => onRemove("certifications", item.id)}
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
          onAdd("certifications", {
            name: "Nouvelle certification",
            issuer: "Organisme",
          })
        }
      >
        <Plus className="mr-1 size-3.5" />
        Ajouter une certification
      </Button>
    </div>
  );
}
