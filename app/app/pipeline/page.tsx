"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/nowts/empty-state";
import { PlanLimitBanner } from "@/components/nowts/plan-limit-banner";
import {
  Layout,
  LayoutActions,
  LayoutContent,
  LayoutHeader,
  LayoutTitle,
} from "@/features/page/layout";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { checkAllLimitsAction } from "@/features/plans/check-limits.action";
import { parseMissionAction } from "@/features/ai/parse-mission.action";
import {
  batchArchiveMissionsAction,
  createMissionAction,
  getMissionsAction,
  getMissionAction,
  updateMissionAction,
} from "@/features/missions/missions.action";
import type { MissionParserOutput } from "@/features/ai/prompts/mission-parser.prompt";
import type { MissionStatus } from "@/components/nowts/status-badge";
import type { CreateMissionInput } from "@/features/missions/missions.schema";

type MissionPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
import { QuickCaptureInput } from "@/features/missions/components/capture/quick-capture-input";
import { MissionPreview } from "@/features/missions/components/capture/mission-preview";
import { MissionForm } from "@/features/missions/components/mission-form";
import { MissionDetailSheet } from "@/features/missions/components/mission-detail-sheet";
import { MissionKanban } from "@/features/missions/components/pipeline/mission-kanban";
import { MissionListTable } from "@/features/missions/components/pipeline/mission-list-table";
import { exportMissionsAction } from "@/features/missions/export-missions.action";
import { getUserPlatformsAction } from "@/features/platforms/platforms.action";
import { PipelineFilters } from "@/features/missions/components/pipeline/pipeline-filters";
import { downloadCsv, generateCsv } from "@/lib/csv-export";
import { Archive, Download, Kanban, List, Plus, Search } from "lucide-react";
import type { ComponentProps } from "react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

type SelectedMission = ComponentProps<typeof MissionDetailSheet>["mission"];

type ViewMode = "kanban" | "list";
type SortField = "createdAt" | "updatedAt" | "tjm" | "score" | "title";
type SortOrder = "asc" | "desc";

type MissionsData =
  Awaited<ReturnType<typeof getMissionsAction>> extends { data?: infer D }
    ? NonNullable<D>
    : never;

export default function PipelinePage() {
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // Filters
  const [statusFilter, setStatusFilter] = useState<MissionStatus[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<MissionPriority[]>([]);
  const [platformIdFilter, setPlatformIdFilter] = useState<
    string | undefined
  >();
  const [tjmMinFilter, setTjmMinFilter] = useState<number | undefined>();
  const [tjmMaxFilter, setTjmMaxFilter] = useState<number | undefined>();
  const [platforms, setPlatforms] = useState<
    { id: string; platform: { id: string; name: string } }[]
  >([]);

  // Data
  const [missions, setMissions] = useState<MissionsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [missionLimits, setMissionLimits] = useState<{
    used: number;
    limit: number;
    remaining: number;
  } | null>(null);

  // Capture flow
  const [isParsing, setIsParsing] = useState(false);
  const [parsedData, setParsedData] = useState<MissionParserOutput | null>(
    null,
  );
  const [isCreating, setIsCreating] = useState(false);

  // Form dialog
  const [showForm, setShowForm] = useState(false);
  const [editingMission, setEditingMission] = useState<SelectedMission>(null);

  // Selection (list mode)
  const [selectedMissionIds, setSelectedMissionIds] = useState<string[]>([]);

  // Detail sheet
  const [selectedMission, setSelectedMission] = useState<SelectedMission>(null);
  const [showDetail, setShowDetail] = useState(false);

  const fetchMissions = useCallback(async () => {
    try {
      const result = await resolveActionResult(
        getMissionsAction({
          search: search || undefined,
          status: statusFilter.length > 0 ? statusFilter : undefined,
          priority: priorityFilter.length > 0 ? priorityFilter : undefined,
          platformId: platformIdFilter,
          tjmMin: tjmMinFilter,
          tjmMax: tjmMaxFilter,
          sortBy,
          sortOrder,
        }),
      );
      setMissions(result);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors du chargement des missions",
      );
    } finally {
      setIsLoading(false);
    }
  }, [
    search,
    statusFilter,
    priorityFilter,
    platformIdFilter,
    tjmMinFilter,
    tjmMaxFilter,
    sortBy,
    sortOrder,
  ]);

  useEffect(() => {
    void fetchMissions();
  }, [fetchMissions]);

  useEffect(() => {
    void resolveActionResult(getUserPlatformsAction()).then(setPlatforms);
  }, []);

  useEffect(() => {
    void resolveActionResult(checkAllLimitsAction()).then((limits) => {
      setMissionLimits(limits.missions);
    });
  }, []);

  const handleParse = async (source: "url" | "text", content: string) => {
    setIsParsing(true);
    try {
      const result = await resolveActionResult(
        parseMissionAction({ source, content }),
      );
      setParsedData(result);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur lors du parsing",
      );
    } finally {
      setIsParsing(false);
    }
  };

  const handleConfirmParsed = async (data: MissionParserOutput) => {
    setIsCreating(true);
    try {
      await resolveActionResult(
        createMissionAction({
          title: data.title,
          company: data.company ?? undefined,
          description: data.description,
          stack: data.stack,
          tjm: data.tjm ?? undefined,
          duration: data.duration ?? undefined,
          workType: data.workType ?? undefined,
          location: data.location ?? undefined,
        }),
      );
      toast.success("Mission créée avec succès");
      setParsedData(null);
      void fetchMissions();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de la création",
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateManual = async (data: CreateMissionInput) => {
    await resolveActionResult(createMissionAction(data));
    toast.success("Mission créée avec succès");
    setShowForm(false);
    void fetchMissions();
  };

  const handleEdit = (mission: NonNullable<SelectedMission>) => {
    setEditingMission(mission);
    setShowDetail(false);
    setShowForm(true);
  };

  const handleUpdateMission = async (data: CreateMissionInput) => {
    if (!editingMission) return;
    await resolveActionResult(
      updateMissionAction({ id: editingMission.id, ...data }),
    );
    toast.success("Mission modifiée avec succès");
    setShowForm(false);
    setEditingMission(null);
    void fetchMissions();
  };

  const handleMissionClick = async (missionId: string) => {
    try {
      const result = await resolveActionResult(
        getMissionAction({ id: missionId }),
      );
      setSelectedMission(result);
      setShowDetail(true);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors du chargement de la mission",
      );
    }
  };

  const handleSort = (field: SortField) => {
    if (field === sortBy) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  return (
    <Layout size="xl">
      <LayoutHeader>
        <LayoutTitle>Pipeline</LayoutTitle>
      </LayoutHeader>
      <LayoutActions className="gap-2">
        <div className="flex rounded-lg border p-0.5">
          <Button
            variant={viewMode === "kanban" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("kanban")}
          >
            <Kanban className="size-4" />
            Kanban
          </Button>
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("list")}
          >
            <List className="size-4" />
            Liste
          </Button>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={async () => {
            try {
              const rows = await resolveActionResult(exportMissionsAction());
              const csv = generateCsv(rows, [
                { key: "title", header: "Titre" },
                { key: "company", header: "Entreprise" },
                { key: "status", header: "Statut" },
                { key: "priority", header: "Priorité" },
                { key: "tjm", header: "TJM" },
                { key: "duration", header: "Durée" },
                { key: "workType", header: "Type de travail" },
                { key: "location", header: "Lieu" },
                { key: "stack", header: "Stack" },
                { key: "score", header: "Score" },
                { key: "platform", header: "Plateforme" },
                { key: "contact", header: "Contact" },
                { key: "sourceUrl", header: "URL source" },
                { key: "createdAt", header: "Date de création" },
              ]);
              downloadCsv(
                csv,
                `missions-${new Date().toISOString().split("T")[0]}.csv`,
              );
              toast.success("Export CSV téléchargé");
            } catch {
              toast.error("Erreur lors de l'export");
            }
          }}
        >
          <Download className="size-4" />
          Exporter CSV
        </Button>
        {selectedMissionIds.length > 0 && (
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              try {
                await resolveActionResult(
                  batchArchiveMissionsAction({ ids: selectedMissionIds }),
                );
                toast.success(
                  `${selectedMissionIds.length} mission(s) archivée(s)`,
                );
                setSelectedMissionIds([]);
                void fetchMissions();
              } catch {
                toast.error("Erreur lors de l'archivage");
              }
            }}
          >
            <Archive className="size-4" />
            Archiver la sélection ({selectedMissionIds.length})
          </Button>
        )}
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus className="size-4" />
          Ajouter
        </Button>
      </LayoutActions>

      <LayoutContent className="flex flex-col gap-4">
        {missionLimits && (
          <PlanLimitBanner
            used={missionLimits.used}
            limit={missionLimits.limit}
            remaining={missionLimits.remaining}
            featureLabel="missions"
          />
        )}

        {/* Quick capture */}
        <QuickCaptureInput onParse={handleParse} isLoading={isParsing} />

        {/* Parsed preview */}
        {parsedData && (
          <MissionPreview
            data={parsedData}
            onConfirm={handleConfirmParsed}
            onCancel={() => setParsedData(null)}
            isLoading={isCreating}
          />
        )}

        {/* Search bar */}
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une mission..."
            className="pl-10"
          />
        </div>

        {/* Filters */}
        <PipelineFilters
          filters={{
            status: statusFilter,
            priority: priorityFilter,
            platformId: platformIdFilter,
            tjmMin: tjmMinFilter,
            tjmMax: tjmMaxFilter,
          }}
          platforms={platforms}
          onFiltersChange={(f) => {
            setStatusFilter(f.status);
            setPriorityFilter(f.priority);
            setPlatformIdFilter(f.platformId);
            setTjmMinFilter(f.tjmMin);
            setTjmMaxFilter(f.tjmMax);
          }}
        />

        {/* Content */}
        {isLoading ? (
          <div className="text-muted-foreground py-12 text-center text-sm">
            Chargement...
          </div>
        ) : !missions || missions.total === 0 ? (
          <EmptyState
            icon={Kanban}
            title="Aucune mission"
            description="Colle une URL d'annonce ci-dessus ou ajoute une mission manuellement."
            action={{
              label: "Ajouter une mission",
              onClick: () => setShowForm(true),
            }}
          />
        ) : viewMode === "kanban" ? (
          <MissionKanban
            missions={missions.missions.map((m) => ({
              id: m.id,
              title: m.title,
              company: m.company,
              status: m.status,
              tjm: m.tjm,
              duration: m.duration,
              workType: m.workType,
              location: m.location,
              score: m.score,
              stack: m.stack,
              platform: m.platform,
              followUps: m.followUps,
            }))}
            counters={missions.counters}
            onMissionClick={handleMissionClick}
            onRefresh={fetchMissions}
          />
        ) : (
          <MissionListTable
            missions={missions.missions.map((m) => ({
              id: m.id,
              title: m.title,
              company: m.company,
              status: m.status as MissionStatus,
              tjm: m.tjm,
              score: m.score,
              createdAt: m.createdAt,
              platform: m.platform,
              followUps: m.followUps,
            }))}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
            onMissionClick={handleMissionClick}
            selectedIds={selectedMissionIds}
            onSelectionChange={setSelectedMissionIds}
          />
        )}
      </LayoutContent>

      {/* Manual creation / edit dialog */}
      <Dialog
        open={showForm}
        onOpenChange={(open) => {
          setShowForm(open);
          if (!open) setEditingMission(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingMission ? "Modifier la mission" : "Nouvelle mission"}
            </DialogTitle>
          </DialogHeader>
          <MissionForm
            key={editingMission?.id ?? "new"}
            score={editingMission?.score}
            defaultValues={
              editingMission
                ? {
                    title: editingMission.title,
                    company: editingMission.company ?? undefined,
                    description: editingMission.description ?? undefined,
                    status: editingMission.status,
                    priority:
                      editingMission.priority as CreateMissionInput["priority"],
                    tjm: editingMission.tjm ?? undefined,
                    duration: editingMission.duration ?? undefined,
                    workType:
                      editingMission.workType as CreateMissionInput["workType"],
                    location: editingMission.location ?? undefined,
                    stack: editingMission.stack,
                    sourceUrl: editingMission.sourceUrl ?? "",
                    notes: editingMission.notes ?? undefined,
                    profileId: editingMission.profile?.id ?? undefined,
                  }
                : undefined
            }
            onSubmit={editingMission ? handleUpdateMission : handleCreateManual}
            onCancel={() => {
              setShowForm(false);
              setEditingMission(null);
            }}
            submitLabel={editingMission ? "Modifier" : "Créer la mission"}
          />
        </DialogContent>
      </Dialog>

      {/* Detail sheet */}
      <MissionDetailSheet
        mission={selectedMission}
        open={showDetail}
        onOpenChange={setShowDetail}
        onEdit={handleEdit}
        onRefresh={() => {
          void fetchMissions();
          setShowDetail(false);
        }}
      />
    </Layout>
  );
}
