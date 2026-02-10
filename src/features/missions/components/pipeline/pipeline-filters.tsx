"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MISSION_STATUS_CONFIG } from "@/components/nowts/status-badge";
import type { MissionStatus } from "@/components/nowts/status-badge";
import { cn } from "@/lib/utils";
import { RotateCcw, SlidersHorizontal } from "lucide-react";
import { useState } from "react";

const PRIORITY_CONFIG = {
  LOW: { label: "Basse" },
  MEDIUM: { label: "Moyenne" },
  HIGH: { label: "Haute" },
  URGENT: { label: "Urgente" },
} as const;

type MissionPriority = keyof typeof PRIORITY_CONFIG;

type PipelineFiltersProps = {
  filters: {
    status: MissionStatus[];
    priority: MissionPriority[];
    platformId: string | undefined;
    tjmMin: number | undefined;
    tjmMax: number | undefined;
  };
  platforms: { id: string; platform: { id: string; name: string } }[];
  onFiltersChange: (filters: PipelineFiltersProps["filters"]) => void;
};

export function PipelineFilters({
  filters,
  platforms,
  onFiltersChange,
}: PipelineFiltersProps) {
  const [open, setOpen] = useState(false);

  const activeCount =
    filters.status.length +
    filters.priority.length +
    (filters.platformId ? 1 : 0) +
    (filters.tjmMin !== undefined ? 1 : 0) +
    (filters.tjmMax !== undefined ? 1 : 0);

  const toggleStatus = (status: MissionStatus) => {
    const next = filters.status.includes(status)
      ? filters.status.filter((s) => s !== status)
      : [...filters.status, status];
    onFiltersChange({ ...filters, status: next });
  };

  const togglePriority = (priority: MissionPriority) => {
    const next = filters.priority.includes(priority)
      ? filters.priority.filter((p) => p !== priority)
      : [...filters.priority, priority];
    onFiltersChange({ ...filters, priority: next });
  };

  const handleReset = () => {
    onFiltersChange({
      status: [] as MissionStatus[],
      priority: [] as MissionPriority[],
      platformId: undefined,
      tjmMin: undefined,
      tjmMax: undefined,
    });
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="flex items-center gap-2">
        <CollapsibleTrigger asChild>
          <Button variant="outline" size="sm">
            <SlidersHorizontal className="size-4" />
            Filtres
            {activeCount > 0 && (
              <Badge variant="secondary" className="ml-1 px-1.5 py-0">
                {activeCount}
              </Badge>
            )}
          </Button>
        </CollapsibleTrigger>
        {activeCount > 0 && (
          <Button variant="ghost" size="sm" onClick={handleReset}>
            <RotateCcw className="size-3" />
            Reinitialiser
          </Button>
        )}
      </div>

      <CollapsibleContent className="mt-3">
        <div className="flex flex-col gap-4 rounded-lg border p-4">
          {/* Status */}
          <div className="flex flex-col gap-2">
            <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Statut
            </span>
            <div className="flex flex-wrap gap-2">
              {(
                Object.entries(MISSION_STATUS_CONFIG) as [
                  MissionStatus,
                  (typeof MISSION_STATUS_CONFIG)[MissionStatus],
                ][]
              ).map(([key, config]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleStatus(key)}
                  className={cn(
                    "inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                    filters.status.includes(key)
                      ? config.className
                      : "text-muted-foreground hover:bg-accent border-transparent opacity-60 hover:opacity-100",
                  )}
                >
                  {config.label}
                </button>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div className="flex flex-col gap-2">
            <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Priorite
            </span>
            <div className="flex flex-wrap gap-2">
              {(
                Object.entries(PRIORITY_CONFIG) as [
                  MissionPriority,
                  (typeof PRIORITY_CONFIG)[MissionPriority],
                ][]
              ).map(([key, config]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => togglePriority(key)}
                  className={cn(
                    "inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                    filters.priority.includes(key)
                      ? "bg-primary text-primary-foreground border-transparent"
                      : "text-muted-foreground hover:bg-accent border-transparent opacity-60 hover:opacity-100",
                  )}
                >
                  {config.label}
                </button>
              ))}
            </div>
          </div>

          {/* Platform + TJM */}
          <div className="flex flex-wrap items-end gap-4">
            {/* Platform */}
            <div className="flex flex-col gap-2">
              <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Plateforme
              </span>
              <Select
                value={filters.platformId ?? "all"}
                onValueChange={(v) =>
                  onFiltersChange({
                    ...filters,
                    platformId: v === "all" ? undefined : v,
                  })
                }
              >
                <SelectTrigger size="sm" className="w-[180px]">
                  <SelectValue placeholder="Toutes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  {platforms.map((up) => (
                    <SelectItem key={up.id} value={up.platform.id}>
                      {up.platform.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* TJM Min */}
            <div className="flex flex-col gap-2">
              <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                TJM min
              </span>
              <Input
                type="number"
                placeholder="0"
                className="h-8 w-[100px]"
                value={filters.tjmMin ?? ""}
                onChange={(e) =>
                  onFiltersChange({
                    ...filters,
                    tjmMin: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
              />
            </div>

            {/* TJM Max */}
            <div className="flex flex-col gap-2">
              <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                TJM max
              </span>
              <Input
                type="number"
                placeholder="1000"
                className="h-8 w-[100px]"
                value={filters.tjmMax ?? ""}
                onChange={(e) =>
                  onFiltersChange({
                    ...filters,
                    tjmMax: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
              />
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
