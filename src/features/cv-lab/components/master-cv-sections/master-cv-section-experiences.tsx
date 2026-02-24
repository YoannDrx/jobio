"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import {
  CONTRACT_TYPES,
  REMOTE_MODES,
  type ContractType,
  type MasterCvExperience,
  type RemoteMode,
} from "../../cv-lab.schema";
import { TagInput } from "../tag-input";
import { DraggableItemList } from "../draggable-item-list";
import { RichTextEditor } from "../rich-text-editor";
import { AiRewritePopover } from "../ai-rewrite-popover";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import {
  suggestTechStackAction,
  suggestAchievementsAction,
} from "../../cv-suggest.action";
import { FieldError } from "../field-error";

type ExperiencesSectionProps = {
  items: MasterCvExperience[];
  onAdd: (section: string, item: Record<string, unknown>) => Promise<void>;
  onUpdate: (
    section: string,
    itemId: string,
    patch: Record<string, unknown>,
  ) => Promise<void>;
  onRemove: (section: string, itemId: string) => Promise<void>;
  onReorder: (section: string, itemIds: string[]) => Promise<void>;
};

export function ExperiencesSection({
  items,
  onAdd,
  onUpdate,
  onRemove,
  onReorder,
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

  const getItemErrors = (item: MasterCvExperience) => ({
    title: item.title.trim().length === 0 ? "Le titre est requis" : null,
    company:
      item.company.trim().length === 0 ? "L'entreprise est requise" : null,
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
      const itemErrors = getItemErrors(merged as MasterCvExperience);
      if (Object.values(itemErrors).some(Boolean)) return;
    }

    const timer = setTimeout(() => {
      void onUpdate("experiences", itemId, edit);
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
        droppableId="experiences-list"
        items={items}
        onReorder={async (newItemIds) => onReorder("experiences", newItemIds)}
        renderItem={(item) => {
          const current = getEditValue(item);
          const itemErrors = getItemErrors(current as MasterCvExperience);
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
                      <FieldError message={itemErrors.title} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label>Entreprise *</Label>
                      <Input
                        value={current.company}
                        onChange={(e) =>
                          updateEdit(item.id, { company: e.target.value })
                        }
                      />
                      <FieldError message={itemErrors.company} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label>Date debut</Label>
                      <Input
                        value={current.startDate ?? ""}
                        placeholder="janvier 2020"
                        onChange={(e) =>
                          updateEdit(item.id, { startDate: e.target.value })
                        }
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label>Date fin</Label>
                      <Input
                        value={current.endDate ?? ""}
                        placeholder="juin 2023"
                        onChange={(e) =>
                          updateEdit(item.id, { endDate: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="flex flex-col gap-1">
                      <Label>Lieu</Label>
                      <Input
                        value={current.location ?? ""}
                        placeholder="Paris, France"
                        onChange={(e) =>
                          updateEdit(item.id, { location: e.target.value })
                        }
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label>Type de contrat</Label>
                      <Select
                        value={current.contractType ?? ""}
                        onValueChange={(value) =>
                          updateEdit(item.id, {
                            contractType: value as ContractType,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selectionner" />
                        </SelectTrigger>
                        <SelectContent>
                          {CONTRACT_TYPES.map((ct) => (
                            <SelectItem key={ct} value={ct}>
                              {ct}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label>Mode de travail</Label>
                      <Select
                        value={current.remote ?? ""}
                        onValueChange={(value) =>
                          updateEdit(item.id, {
                            remote: value as RemoteMode,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selectionner" />
                        </SelectTrigger>
                        <SelectContent>
                          {REMOTE_MODES.map((rm) => (
                            <SelectItem key={rm} value={rm}>
                              {rm}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label>Contexte equipe</Label>
                    <Input
                      value={current.teamContext ?? ""}
                      placeholder="Equipe 5 devs, startup, 50K users"
                      onChange={(e) =>
                        updateEdit(item.id, { teamContext: e.target.value })
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
                        context={{
                          jobTitle: current.title,
                          company: current.company,
                        }}
                      />
                    </div>
                    <RichTextEditor
                      value={current.description ?? ""}
                      onChange={(val) =>
                        updateEdit(item.id, { description: val })
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label>Stack technique</Label>
                    <TagInput
                      tags={current.techStack ?? []}
                      onChange={(tags) =>
                        updateEdit(item.id, { techStack: tags })
                      }
                      placeholder="Ajouter une technologie"
                      onSuggest={async () => {
                        const result = await resolveActionResult(
                          suggestTechStackAction({
                            title: current.title,
                            company: current.company,
                            description: current.description ?? undefined,
                          }),
                        );
                        return result.suggestions;
                      }}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label>Realisations cles</Label>
                    <TagInput
                      tags={current.achievements ?? []}
                      onChange={(tags) =>
                        updateEdit(item.id, { achievements: tags })
                      }
                      placeholder="Ajouter une realisation"
                      onSuggest={async () => {
                        const result = await resolveActionResult(
                          suggestAchievementsAction({
                            title: current.title,
                            company: current.company,
                            description: current.description ?? undefined,
                          }),
                        );
                        return result.suggestions;
                      }}
                    />
                  </div>
                  <div className="flex gap-2">
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
            </>
          );
        }}
      />
      <Button
        variant="outline"
        size="sm"
        onClick={async () =>
          onAdd("experiences", {
            title: "Nouveau poste",
            company: "Entreprise",
            description: "",
          })
        }
      >
        <Plus className="mr-1 size-3.5" />
        Ajouter une experience
      </Button>
    </div>
  );
}
