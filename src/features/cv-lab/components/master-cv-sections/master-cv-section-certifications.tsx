"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import type { MasterCvCertification } from "../../cv-lab.schema";

type CertificationsSectionProps = {
  items: MasterCvCertification[];
  onAdd: (section: string, item: Record<string, unknown>) => Promise<void>;
  onUpdate: (
    section: string,
    itemId: string,
    patch: Record<string, unknown>,
  ) => Promise<void>;
  onRemove: (section: string, itemId: string) => Promise<void>;
};

export function CertificationsSection({
  items,
  onAdd,
  onUpdate,
  onRemove,
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

  const handleSaveItem = async (item: MasterCvCertification) => {
    const edit = editState[item.id] as
      | Partial<MasterCvCertification>
      | undefined;
    if (edit && Object.keys(edit).length > 0) {
      await onUpdate("certifications", item.id, edit);
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
                      placeholder="2023-06"
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
                    size="sm"
                    onClick={async () => handleSaveItem(item)}
                    disabled={!editState[item.id]}
                  >
                    Sauvegarder
                  </Button>
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
          </div>
        );
      })}
      <Button
        variant="outline"
        size="sm"
        onClick={async () =>
          onAdd("certifications", { name: "", description: "" })
        }
      >
        <Plus className="mr-1 size-3.5" />
        Ajouter une certification
      </Button>
    </div>
  );
}
