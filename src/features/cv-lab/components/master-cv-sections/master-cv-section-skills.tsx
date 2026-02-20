"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import type { MasterCvSkill } from "../../cv-lab.schema";

type SkillsSectionProps = {
  items: MasterCvSkill[];
  onAdd: (section: string, item: Record<string, unknown>) => Promise<void>;
  onUpdate: (
    section: string,
    itemId: string,
    patch: Record<string, unknown>,
  ) => Promise<void>;
  onRemove: (section: string, itemId: string) => Promise<void>;
};

export function SkillsSection({
  items,
  onAdd,
  onUpdate,
  onRemove,
}: SkillsSectionProps) {
  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <div key={item.id} className="flex items-center gap-2">
          <Input
            className="flex-1"
            value={item.name}
            placeholder="Nom de la competence"
            onChange={async (e) =>
              onUpdate("skills", item.id, { name: e.target.value })
            }
          />
          <Input
            className="w-[130px]"
            value={item.level ?? ""}
            placeholder="Niveau"
            onChange={async (e) =>
              onUpdate("skills", item.id, { level: e.target.value })
            }
          />
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={async () => onRemove("skills", item.id)}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        onClick={async () => onAdd("skills", { name: "" })}
      >
        <Plus className="mr-1 size-3.5" />
        Ajouter une competence
      </Button>
    </div>
  );
}
