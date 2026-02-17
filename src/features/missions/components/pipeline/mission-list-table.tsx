"use client";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScoreRing } from "@/components/nowts/score-ring";
import { StatusBadge } from "@/components/nowts/status-badge";
import type { MissionStatus } from "@/components/nowts/status-badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp, ArrowUpDown, Calendar } from "lucide-react";

type SortField = "createdAt" | "updatedAt" | "tjm" | "score" | "title";
type SortOrder = "asc" | "desc";

type ListMission = {
  id: string;
  title: string;
  company: string | null;
  status: MissionStatus;
  tjm: number | null;
  score: number;
  createdAt: Date;
  platform: { name: string } | null;
  followUps: { scheduledAt: Date }[];
};

type MissionListTableProps = {
  missions: ListMission[];
  sortBy: SortField;
  sortOrder: SortOrder;
  onSort: (field: SortField) => void;
  onMissionClick: (missionId: string) => void;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
};

function SortIcon({
  field,
  current,
  order,
}: {
  field: SortField;
  current: SortField;
  order: SortOrder;
}) {
  if (field !== current) return <ArrowUpDown className="size-3 opacity-30" />;
  return order === "asc" ? (
    <ArrowUp className="size-3" />
  ) : (
    <ArrowDown className="size-3" />
  );
}

export function MissionListTable({
  missions,
  sortBy,
  sortOrder,
  onSort,
  onMissionClick,
  selectedIds,
  onSelectionChange,
}: MissionListTableProps) {
  const selectable = !!onSelectionChange;
  const allSelected =
    selectable &&
    missions.length > 0 &&
    missions.every((m) => selectedIds?.includes(m.id));

  const toggleAll = () => {
    if (!onSelectionChange) return;
    if (allSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(missions.map((m) => m.id));
    }
  };

  const toggleOne = (id: string) => {
    if (!onSelectionChange || !selectedIds) return;
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((i) => i !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {selectable && (
            <TableHead className="w-10">
              <Checkbox
                checked={allSelected}
                onCheckedChange={toggleAll}
                aria-label="Tout sélectionner"
              />
            </TableHead>
          )}
          <TableHead className="hidden w-12 md:table-cell">
            <button
              className="flex items-center gap-1"
              onClick={() => onSort("score")}
            >
              Score{" "}
              <SortIcon field="score" current={sortBy} order={sortOrder} />
            </button>
          </TableHead>
          <TableHead>
            <button
              className="flex items-center gap-1"
              onClick={() => onSort("title")}
            >
              Titre{" "}
              <SortIcon field="title" current={sortBy} order={sortOrder} />
            </button>
          </TableHead>
          <TableHead>Entreprise</TableHead>
          <TableHead>
            <button
              className="flex items-center gap-1"
              onClick={() => onSort("tjm")}
            >
              TJM <SortIcon field="tjm" current={sortBy} order={sortOrder} />
            </button>
          </TableHead>
          <TableHead>Statut</TableHead>
          <TableHead className="hidden md:table-cell">Plateforme</TableHead>
          <TableHead className="hidden md:table-cell">
            Prochaine action
          </TableHead>
          <TableHead className="hidden md:table-cell">
            <button
              className="flex items-center gap-1"
              onClick={() => onSort("createdAt")}
            >
              Date{" "}
              <SortIcon field="createdAt" current={sortBy} order={sortOrder} />
            </button>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {missions.map((mission) => (
          <TableRow
            key={mission.id}
            className="cursor-pointer"
            onClick={() => onMissionClick(mission.id)}
          >
            {selectable && (
              <TableCell onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={selectedIds?.includes(mission.id) ?? false}
                  onCheckedChange={() => toggleOne(mission.id)}
                  aria-label={`Sélectionner ${mission.title}`}
                />
              </TableCell>
            )}
            <TableCell className="hidden md:table-cell">
              <ScoreRing score={mission.score} size={28} />
            </TableCell>
            <TableCell className="font-medium">{mission.title}</TableCell>
            <TableCell className="text-muted-foreground">
              {mission.company ?? "—"}
            </TableCell>
            <TableCell>
              {mission.tjm ? (
                <span className="font-mono text-sm">{mission.tjm}€/j</span>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </TableCell>
            <TableCell>
              <StatusBadge status={mission.status} />
            </TableCell>
            <TableCell className="hidden md:table-cell">
              {mission.platform ? (
                <Badge variant="secondary" className="text-xs">
                  {mission.platform.name}
                </Badge>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </TableCell>
            <TableCell className="hidden md:table-cell">
              {mission.followUps.length > 0 ? (
                <span
                  className={cn(
                    "flex items-center gap-1 text-xs",
                    new Date(mission.followUps[0].scheduledAt).getTime() <
                      Date.now() && "text-status-danger",
                  )}
                >
                  <Calendar className="size-3" />
                  {new Date(
                    mission.followUps[0].scheduledAt,
                  ).toLocaleDateString("fr-FR")}
                </span>
              ) : (
                <span className="text-muted-foreground text-xs">—</span>
              )}
            </TableCell>
            <TableCell className="text-muted-foreground hidden text-sm md:table-cell">
              {new Date(mission.createdAt).toLocaleDateString("fr-FR")}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
