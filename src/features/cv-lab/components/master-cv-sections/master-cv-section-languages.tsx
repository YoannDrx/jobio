"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import type { MasterCvLanguage } from "../../cv-lab.schema";

type LanguagesSectionProps = {
  items: MasterCvLanguage[];
  onAdd: (section: string, item: Record<string, unknown>) => Promise<void>;
  onUpdate: (
    section: string,
    itemId: string,
    patch: Record<string, unknown>,
  ) => Promise<void>;
  onRemove: (section: string, itemId: string) => Promise<void>;
};

export function LanguagesSection({
  items,
  onAdd,
  onUpdate,
  onRemove,
}: LanguagesSectionProps) {
  const [editState, setEditState] = useState<
    Record<string, Partial<MasterCvLanguage>>
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

  const handleChange = (itemId: string, patch: Partial<MasterCvLanguage>) => {
    setEditState((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], ...patch },
    }));

    clearTimeout(debounceTimersRef.current[itemId]);

    debounceTimersRef.current[itemId] = setTimeout(() => {
      void onUpdate("languages", itemId, patch);
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
              placeholder="Langue"
              onChange={(e) => handleChange(item.id, { name: e.target.value })}
            />
            <Input
              className="w-[130px]"
              value={current.level || ""}
              placeholder="Niveau"
              onChange={(e) => handleChange(item.id, { level: e.target.value })}
            />
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={async () => onRemove("languages", item.id)}
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
          onAdd("languages", { name: "Nouvelle langue", level: "Courant" })
        }
      >
        <Plus className="mr-1 size-3.5" />
        Ajouter une langue
      </Button>
    </div>
  );
}
