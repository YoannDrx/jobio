"use client";

import { useEffect, useRef, useState } from "react";
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
  const [editState, setEditState] = useState<
    Record<string, Partial<MasterCvSkill>>
  >({});
  const debounceTimersRef = useRef<
    Record<string, ReturnType<typeof setTimeout>>
  >({});

  useEffect(() => {
    const timers = debounceTimersRef.current;
    return () => {
      Object.values(timers).forEach(clearTimeout);
    };
  }, []);

  const handleChange = (itemId: string, patch: Partial<MasterCvSkill>) => {
    setEditState((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], ...patch },
    }));

    clearTimeout(debounceTimersRef.current[itemId]);

    debounceTimersRef.current[itemId] = setTimeout(() => {
      void onUpdate("skills", itemId, patch);
      setEditState((prev) => {
        const { [itemId]: _, ...rest } = prev;
        return rest;
      });
    }, 1500);
  };

  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => {
        const current = { ...item, ...editState[item.id] };
        return (
          <div key={item.id} className="flex items-center gap-2">
            <Input
              className="flex-1"
              value={current.name}
              placeholder="Nom de la competence"
              onChange={(e) => handleChange(item.id, { name: e.target.value })}
            />
            <Input
              className="w-[130px]"
              value={current.level ?? ""}
              placeholder="Niveau"
              onChange={(e) => handleChange(item.id, { level: e.target.value })}
            />
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={async () => onRemove("skills", item.id)}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        );
      })}
      <Button
        variant="outline"
        size="sm"
        onClick={async () =>
          onAdd("skills", {
            name: "Nouvelle competence",
            level: "INTERMEDIATE",
          })
        }
      >
        <Plus className="mr-1 size-3.5" />
        Ajouter une competence
      </Button>
    </div>
  );
}
