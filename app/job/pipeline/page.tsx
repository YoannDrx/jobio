"use client";

import { Button } from "@/components/ui/button";
import {
  EditSideSheet,
  EditSideSheetContent,
  EditSideSheetHeader,
  EditSideSheetBody,
} from "@/components/nowts/edit-side-sheet";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { EmptyState } from "@/components/nowts/empty-state";
import { PlanLimitBanner } from "@/components/nowts/plan-limit-banner";
import { CompanyList } from "@/features/companies/components/company-list";
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
  bulkUpdateStatusAction,
  createMissionAction,
  getMissionsAction,
  getMissionAction,
  updateMissionAction,
} from "@/features/missions/missions.action";
import type { MissionParserOutput } from "@/features/ai/prompts/mission-parser.prompt";
import type { MissionStatus } from "@/components/nowts/status-badge";
import {
  MISSION_STATUS_LABELS,
  PIPELINE_STATUS_VALUES,
} from "@/features/missions/mission-status";
import type { CreateMissionInput } from "@/features/missions/missions.schema";

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
import {
  Archive,
  BookmarkPlus,
  BookmarkX,
  Building2,
  Download,
  Kanban,
  List,
  Plus,
  Search,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { FeatureGuide } from "@/components/nowts/feature-guide";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ComponentProps } from "react";
import { useCallback, useEffect, useState } from "react";
import { dialogManager } from "@/features/dialog-manager/dialog-manager";
import { toast } from "sonner";
import {
  parseAsArrayOf,
  parseAsString,
  parseAsStringLiteral,
  useQueryState,
} from "nuqs";

type SelectedMission = ComponentProps<typeof MissionDetailSheet>["mission"];

type SortField = "createdAt" | "updatedAt" | "tjm" | "score" | "title";

type SavedPipelineView = {
  id: string;
  name: string;
  state: {
    viewMode: "kanban" | "list";
    search: string;
    sortBy: SortField;
    sortOrder: "asc" | "desc";
    statusFilter: string[];
    priorityFilter: string[];
    platformIdFilter: string;
    tjmMinFilter: string;
    tjmMaxFilter: string;
  };
};

type MissionsData =
  Awaited<ReturnType<typeof getMissionsAction>> extends { data?: infer D }
    ? NonNullable<D>
    : never;

const SAVED_PIPELINE_VIEWS_STORAGE_KEY = "jobio.pipeline.saved-views.v1";

export default function PipelinePage() {
  // URL-synced state via nuqs
  const [viewMode, setViewMode] = useQueryState(
    "view",
    parseAsStringLiteral(["kanban", "list"] as const).withDefault("kanban"),
  );
  const [search, setSearch] = useQueryState("q", parseAsString.withDefault(""));
  const [sortBy, setSortBy] = useQueryState(
    "sort",
    parseAsStringLiteral([
      "createdAt",
      "updatedAt",
      "tjm",
      "score",
      "title",
    ] as const).withDefault("createdAt"),
  );
  const [sortOrder, setSortOrder] = useQueryState(
    "order",
    parseAsStringLiteral(["asc", "desc"] as const).withDefault("desc"),
  );
  const [missionIdParam, setMissionIdParam] = useQueryState(
    "missionId",
    parseAsString,
  );

  // Filters (URL-synced)
  const [statusFilter, setStatusFilter] = useQueryState(
    "status",
    parseAsArrayOf(parseAsString).withDefault([]),
  );
  const [priorityFilter, setPriorityFilter] = useQueryState(
    "priority",
    parseAsArrayOf(parseAsString).withDefault([]),
  );
  const [platformIdFilter, setPlatformIdFilter] = useQueryState(
    "platform",
    parseAsString.withDefault(""),
  );
  const [tjmMinFilter, setTjmMinFilter] = useQueryState(
    "tjm_min",
    parseAsString.withDefault(""),
  );
  const [tjmMaxFilter, setTjmMaxFilter] = useQueryState(
    "tjm_max",
    parseAsString.withDefault(""),
  );
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
  const [savedViews, setSavedViews] = useState<SavedPipelineView[]>([]);
  const [selectedSavedViewId, setSelectedSavedViewId] = useState("");

  // Companies sheet
  const [showCompanies, setShowCompanies] = useState(false);

  const fetchMissionLimits = useCallback(async () => {
    try {
      const limits = await resolveActionResult(checkAllLimitsAction());
      setMissionLimits(limits.missions);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors du chargement des limites",
      );
    }
  }, []);

  const fetchMissions = useCallback(async () => {
    try {
      const result = await resolveActionResult(
        getMissionsAction({
          search: search || undefined,
          status:
            statusFilter.length > 0
              ? (statusFilter as MissionStatus[])
              : [...PIPELINE_STATUS_VALUES],
          priority:
            priorityFilter.length > 0
              ? (priorityFilter as ("LOW" | "MEDIUM" | "HIGH" | "URGENT")[])
              : undefined,
          platformId: platformIdFilter || undefined,
          tjmMin: tjmMinFilter ? Number(tjmMinFilter) : undefined,
          tjmMax: tjmMaxFilter ? Number(tjmMaxFilter) : undefined,
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
    void fetchMissionLimits();
  }, [fetchMissionLimits]);

  const openMissionDetail = useCallback(async (missionId: string) => {
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
  }, []);

  useEffect(() => {
    if (!missionIdParam) return;
    void openMissionDetail(missionIdParam);
  }, [missionIdParam, openMissionDetail]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const serialized = window.localStorage.getItem(
        SAVED_PIPELINE_VIEWS_STORAGE_KEY,
      );
      if (!serialized) return;
      const parsed = JSON.parse(serialized) as SavedPipelineView[];
      if (Array.isArray(parsed)) {
        setSavedViews(parsed);
      }
    } catch {
      // Ignore invalid local cache.
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      SAVED_PIPELINE_VIEWS_STORAGE_KEY,
      JSON.stringify(savedViews),
    );
  }, [savedViews]);

  useEffect(() => {
    if (!selectedSavedViewId) return;
    const exists = savedViews.some((view) => view.id === selectedSavedViewId);
    if (!exists) {
      setSelectedSavedViewId("");
    }
  }, [savedViews, selectedSavedViewId]);

  const applySavedView = useCallback(
    (viewId: string) => {
      const view = savedViews.find((item) => item.id === viewId);
      if (!view) return;
      setSelectedSavedViewId(view.id);
      void setViewMode(view.state.viewMode);
      void setSearch(view.state.search);
      void setSortBy(view.state.sortBy);
      void setSortOrder(view.state.sortOrder);
      void setStatusFilter(view.state.statusFilter);
      void setPriorityFilter(view.state.priorityFilter);
      void setPlatformIdFilter(view.state.platformIdFilter);
      void setTjmMinFilter(view.state.tjmMinFilter);
      void setTjmMaxFilter(view.state.tjmMaxFilter);
      toast.success(`Vue "${view.name}" appliquée`);
    },
    [
      savedViews,
      setPriorityFilter,
      setPlatformIdFilter,
      setSearch,
      setSortBy,
      setSortOrder,
      setStatusFilter,
      setTjmMaxFilter,
      setTjmMinFilter,
      setViewMode,
    ],
  );

  const saveCurrentView = useCallback(() => {
    dialogManager.input({
      title: "Sauvegarder la vue",
      description: "Donne un nom à cette vue pour la retrouver facilement.",
      input: {
        label: "Nom de la vue",
        placeholder: "Ex: Missions actives",
      },
      action: {
        label: "Sauvegarder",
        onClick: async (value) => {
          const name = value?.trim();
          if (!name) {
            toast.error("Nom invalide");
            return;
          }
          const next: SavedPipelineView = {
            id: `view-${Date.now()}`,
            name,
            state: {
              viewMode,
              search,
              sortBy,
              sortOrder,
              statusFilter,
              priorityFilter,
              platformIdFilter,
              tjmMinFilter,
              tjmMaxFilter,
            },
          };
          setSavedViews((prev) => [next, ...prev].slice(0, 20));
          setSelectedSavedViewId(next.id);
          toast.success(`Vue "${name}" sauvegardée`);
        },
      },
      cancel: { label: "Annuler" },
    });
  }, [
    platformIdFilter,
    priorityFilter,
    search,
    sortBy,
    sortOrder,
    statusFilter,
    tjmMaxFilter,
    tjmMinFilter,
    viewMode,
  ]);

  const deleteSelectedView = useCallback(() => {
    if (!selectedSavedViewId) return;
    setSavedViews((prev) =>
      prev.filter((view) => view.id !== selectedSavedViewId),
    );
    setSelectedSavedViewId("");
    toast.success("Vue supprimée");
  }, [selectedSavedViewId]);

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
      void fetchMissionLimits();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de la création",
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateManual = async (data: CreateMissionInput) => {
    try {
      await resolveActionResult(createMissionAction(data));
      toast.success("Mission créée avec succès");
      setShowForm(false);
      void fetchMissions();
      void fetchMissionLimits();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de la création",
      );
    }
  };

  const handleEdit = (mission: NonNullable<SelectedMission>) => {
    setEditingMission(mission);
    setShowDetail(false);
    void setMissionIdParam(null);
    setShowForm(true);
  };

  const handleUpdateMission = async (data: CreateMissionInput) => {
    if (!editingMission) return;
    try {
      await resolveActionResult(
        updateMissionAction({ id: editingMission.id, ...data }),
      );
      toast.success("Mission modifiée avec succès");
      setShowForm(false);
      setEditingMission(null);
      void fetchMissions();
      void fetchMissionLimits();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors de la modification",
      );
    }
  };

  const handleMissionClick = (missionId: string) => {
    void setMissionIdParam(missionId);
  };

  const handleSort = (field: SortField) => {
    if (field === sortBy) {
      void setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      void setSortBy(field);
      void setSortOrder("desc");
    }
  };

  return (
    <Layout size="xl">
      <LayoutHeader>
        <div className="flex items-center gap-1">
          <LayoutTitle>Pipeline</LayoutTitle>
          <FeatureGuide title="Pipeline">
            <p>Le pipeline représente le cycle de tes missions :</p>
            <p>
              À postuler → Postulé → Entretien → Proposition → Accepté / Refusé
            </p>
            <p>Chaque statut correspond à une étape du processus commercial.</p>
          </FeatureGuide>
        </div>
      </LayoutHeader>
      <LayoutActions className="gap-2">
        {savedViews.length > 0 ? (
          <Select value={selectedSavedViewId} onValueChange={applySavedView}>
            <SelectTrigger className="h-9 w-[220px]">
              <SelectValue placeholder="Vues sauvegardées" />
            </SelectTrigger>
            <SelectContent>
              {savedViews.map((view) => (
                <SelectItem key={view.id} value={view.id}>
                  {view.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Button size="sm" variant="outline" disabled>
            Vues sauvegardées (0)
          </Button>
        )}
        <Button size="sm" variant="outline" onClick={saveCurrentView}>
          <BookmarkPlus className="size-4" />
          Sauvegarder vue
        </Button>
        {selectedSavedViewId && (
          <Button size="sm" variant="outline" onClick={deleteSelectedView}>
            <BookmarkX className="size-4" />
            Supprimer vue
          </Button>
        )}
        <div className="flex rounded-lg border p-0.5">
          <Button
            variant={viewMode === "kanban" ? "secondary" : "ghost"}
            size="sm"
            onClick={async () => setViewMode("kanban")}
          >
            <Kanban className="size-4" />
            Kanban
          </Button>
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="sm"
            onClick={async () => setViewMode("list")}
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
              const rows = await resolveActionResult(
                exportMissionsAction({
                  search: search || undefined,
                  status:
                    statusFilter.length > 0
                      ? (statusFilter as MissionStatus[])
                      : undefined,
                  priority:
                    priorityFilter.length > 0
                      ? (priorityFilter as (
                          | "LOW"
                          | "MEDIUM"
                          | "HIGH"
                          | "URGENT"
                        )[])
                      : undefined,
                  platformId: platformIdFilter || undefined,
                  tjmMin: tjmMinFilter ? Number(tjmMinFilter) : undefined,
                  tjmMax: tjmMaxFilter ? Number(tjmMaxFilter) : undefined,
                }),
              );
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
          <>
            <Select
              onValueChange={async (status) => {
                try {
                  await resolveActionResult(
                    bulkUpdateStatusAction({
                      ids: selectedMissionIds,
                      status: status as MissionStatus,
                    }),
                  );
                  toast.success(
                    `${selectedMissionIds.length} mission(s) mise(s) à jour`,
                  );
                  setSelectedMissionIds([]);
                  void fetchMissions();
                  void fetchMissionLimits();
                } catch {
                  toast.error("Erreur lors de la mise à jour du statut");
                }
              }}
            >
              <SelectTrigger className="h-9 w-[160px]">
                <SelectValue placeholder="Changer statut..." />
              </SelectTrigger>
              <SelectContent>
                {PIPELINE_STATUS_VALUES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {MISSION_STATUS_LABELS[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                try {
                  const missionsToExport = missions?.missions.filter((m) =>
                    selectedMissionIds.includes(m.id),
                  );
                  if (!missionsToExport || missionsToExport.length === 0) {
                    toast.error("Aucune mission à exporter");
                    return;
                  }
                  const csv = generateCsv(
                    missionsToExport.map((m) => ({
                      title: m.title,
                      company: m.company ?? "",
                      status: MISSION_STATUS_LABELS[m.status as MissionStatus],
                      tjm: m.tjm ?? "",
                      createdAt: new Date(m.createdAt)
                        .toISOString()
                        .split("T")[0],
                    })),
                    [
                      { key: "title", header: "Titre" },
                      { key: "company", header: "Entreprise" },
                      { key: "status", header: "Statut" },
                      { key: "tjm", header: "TJM (€/j)" },
                      { key: "createdAt", header: "Date de création" },
                    ],
                  );
                  downloadCsv(
                    csv,
                    `missions-selection-${new Date().toISOString().split("T")[0]}.csv`,
                  );
                  toast.success("Export CSV téléchargé");
                } catch {
                  toast.error("Erreur lors de l'export");
                }
              }}
            >
              <Download className="size-4" />
              Exporter ({selectedMissionIds.length})
            </Button>
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
                  void fetchMissionLimits();
                } catch {
                  toast.error("Erreur lors de l'archivage");
                }
              }}
            >
              <Archive className="size-4" />
              Archiver la sélection ({selectedMissionIds.length})
            </Button>
          </>
        )}
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowCompanies(true)}
        >
          <Building2 className="mr-2 size-4" />
          Entreprises cibles
        </Button>
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
            featureLabel="missions actives"
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
            onChange={async (e) => setSearch(e.target.value)}
            placeholder="Rechercher une mission..."
            className="pl-10"
          />
        </div>

        {/* Filters */}
        <PipelineFilters
          filters={{
            status: statusFilter as MissionStatus[],
            priority: priorityFilter as (
              | "LOW"
              | "MEDIUM"
              | "HIGH"
              | "URGENT"
            )[],
            platformId: platformIdFilter || undefined,
            tjmMin: tjmMinFilter ? Number(tjmMinFilter) : undefined,
            tjmMax: tjmMaxFilter ? Number(tjmMaxFilter) : undefined,
          }}
          platforms={platforms}
          onFiltersChange={(f) => {
            void setStatusFilter(f.status);
            void setPriorityFilter(f.priority);
            void setPlatformIdFilter(f.platformId ?? "");
            void setTjmMinFilter(
              f.tjmMin !== undefined ? String(f.tjmMin) : "",
            );
            void setTjmMaxFilter(
              f.tjmMax !== undefined ? String(f.tjmMax) : "",
            );
          }}
        />

        {/* Content */}
        {isLoading ? (
          viewMode === "kanban" ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-3">
                  <Skeleton className="h-8 w-32" />
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          )
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
              updatedAt: m.updatedAt,
            }))}
            counters={missions.counters}
            onMissionClick={handleMissionClick}
            onRefresh={() => {
              void fetchMissions();
              void fetchMissionLimits();
            }}
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

      {/* Manual creation / edit sheet */}
      <EditSideSheet
        open={showForm}
        onOpenChange={(open) => {
          setShowForm(open);
          if (!open) setEditingMission(null);
        }}
      >
        <EditSideSheetContent>
          <EditSideSheetHeader
            title={editingMission ? "Modifier la mission" : "Nouvelle mission"}
          />
          <EditSideSheetBody>
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
              onSubmit={
                editingMission ? handleUpdateMission : handleCreateManual
              }
              onCancel={() => {
                setShowForm(false);
                setEditingMission(null);
              }}
              submitLabel={editingMission ? "Modifier" : "Créer la mission"}
            />
          </EditSideSheetBody>
        </EditSideSheetContent>
      </EditSideSheet>

      {/* Detail sheet */}
      <MissionDetailSheet
        mission={selectedMission}
        open={showDetail}
        onOpenChange={(open) => {
          setShowDetail(open);
          if (!open) {
            setSelectedMission(null);
            void setMissionIdParam(null);
          }
        }}
        onEdit={handleEdit}
        onRefresh={() => {
          void fetchMissions();
          void fetchMissionLimits();
          setShowDetail(false);
          setSelectedMission(null);
          void setMissionIdParam(null);
        }}
      />

      {/* Companies sheet */}
      <Sheet open={showCompanies} onOpenChange={setShowCompanies}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle>Entreprises cibles</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <CompanyList />
          </div>
        </SheetContent>
      </Sheet>
    </Layout>
  );
}
