"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Layout,
  LayoutActions,
  LayoutContent,
  LayoutHeader,
  LayoutTitle,
} from "@/features/page/layout";
import { useQueryState, parseAsString, parseAsArrayOf } from "nuqs";
import { toast } from "sonner";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import {
  getFollowUpsForCalendarAction,
  createFollowUpAction,
  completeFollowUpAction,
  deleteFollowUpAction,
  snoozeFollowUpAction,
  updateFollowUpAction,
} from "@/features/follow-ups/follow-ups.action";
import { getMissionsAction } from "@/features/missions/missions.action";
import { FollowUpCalendar } from "@/features/follow-ups/components/follow-up-calendar";
import {
  List,
  CalendarDays,
  Plus,
  MoreHorizontal,
  CheckCircle2,
  Clock,
  Trash2,
  Mail,
  Phone,
  MessageSquare,
  Users,
  Pencil,
} from "lucide-react";
import { Typography } from "@/components/nowts/typography";
import { EmptyState } from "@/components/nowts/empty-state";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { dialogManager } from "@/features/dialog-manager/dialog-manager";
import { FollowUpForm } from "@/features/follow-ups/components/follow-up-form";
import type { CreateFollowUpInput } from "@/features/follow-ups/follow-ups.schema";

type FollowUpForCalendar = {
  id: string;
  title: string;
  type: string;
  scheduledAt: Date;
  completedAt: Date | null;
  mission: {
    title: string;
    company: string | null;
  };
};

type MissionOption = {
  id: string;
  title: string;
  company: string | null;
};

const FOLLOW_UP_TYPE_LABELS: Record<string, string> = {
  EMAIL: "Email",
  CALL: "Appel",
  MESSAGE: "Message",
  MEETING: "Reunion",
};

const FOLLOW_UP_TYPE_ICONS: Record<string, typeof Mail> = {
  EMAIL: Mail,
  CALL: Phone,
  MESSAGE: MessageSquare,
  MEETING: Users,
};

const STATUS_FILTERS = [
  { value: "todo", label: "A faire" },
  { value: "overdue", label: "En retard" },
  { value: "completed", label: "Complete" },
] as const;

function getFollowUpStatus(fu: FollowUpForCalendar): string {
  if (fu.completedAt) return "completed";
  if (new Date(fu.scheduledAt) < new Date()) return "overdue";
  return "todo";
}

export default function FollowUpsPage() {
  const [view, setView] = useQueryState(
    "view",
    parseAsString.withDefault("list"),
  );
  const [typeFilters, setTypeFilters] = useQueryState(
    "type",
    parseAsArrayOf(parseAsString).withDefault([]),
  );
  const [statusFilter, setStatusFilter] = useQueryState(
    "status",
    parseAsString.withDefault(""),
  );
  const [followUps, setFollowUps] = useState<FollowUpForCalendar[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSnoozeOpen, setIsSnoozeOpen] = useState(false);
  const [snoozeTargetId, setSnoozeTargetId] = useState<string | null>(null);
  const [snoozeDate, setSnoozeDate] = useState("");
  const [missions, setMissions] = useState<MissionOption[]>([]);
  const [selectedMissionId, setSelectedMissionId] = useState<string>("");
  const [editingFollowUp, setEditingFollowUp] =
    useState<FollowUpForCalendar | null>(null);

  const fetchFollowUps = useCallback(async () => {
    try {
      setIsLoading(true);
      const now = new Date();
      const result = await resolveActionResult(
        getFollowUpsForCalendarAction({
          month: now.getMonth() + 1,
          year: now.getFullYear(),
        }),
      );
      setFollowUps(
        (result as FollowUpForCalendar[]).map((fu) => ({
          ...fu,
          scheduledAt: new Date(fu.scheduledAt),
          completedAt: fu.completedAt ? new Date(fu.completedAt) : null,
        })),
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur lors du chargement",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchFollowUps();
  }, [fetchFollowUps]);

  useEffect(() => {
    if ((isCreateOpen || editingFollowUp) && missions.length === 0) {
      void resolveActionResult(
        getMissionsAction({
          page: 1,
          pageSize: 200,
          sortBy: "updatedAt",
          sortOrder: "desc",
        }),
      ).then((res) => {
        const data = res as { missions: MissionOption[] };
        setMissions(data.missions);
      });
    }
  }, [isCreateOpen, editingFollowUp, missions.length]);

  const filteredFollowUps = followUps.filter((fu) => {
    if (typeFilters.length > 0 && !typeFilters.includes(fu.type)) return false;
    if (statusFilter && getFollowUpStatus(fu) !== statusFilter) return false;
    return true;
  });

  const groupedFollowUps: Record<string, FollowUpForCalendar[]> = {};
  if (view === "list") {
    filteredFollowUps.forEach((fu) => {
      const dateKey = new Date(fu.scheduledAt).toLocaleDateString("fr-FR", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      if (!(dateKey in groupedFollowUps)) {
        groupedFollowUps[dateKey] = [];
      }
      groupedFollowUps[dateKey].push(fu);
    });
  }

  const handleCreate = async (
    values: Omit<CreateFollowUpInput, "missionId">,
  ) => {
    if (!selectedMissionId) {
      toast.error("Selectionne une mission");
      return;
    }
    await resolveActionResult(
      createFollowUpAction({ ...values, missionId: selectedMissionId }),
    );
    toast.success("Relance creee");
    setIsCreateOpen(false);
    setSelectedMissionId("");
    void fetchFollowUps();
  };

  const handleEdit = async (values: Omit<CreateFollowUpInput, "missionId">) => {
    if (!editingFollowUp) return;
    await resolveActionResult(
      updateFollowUpAction({
        id: editingFollowUp.id,
        type: values.type,
        title: values.title,
        description: values.description,
        scheduledAt: values.scheduledAt,
      }),
    );
    toast.success("Relance mise a jour");
    setEditingFollowUp(null);
    void fetchFollowUps();
  };

  const handleComplete = async (id: string) => {
    try {
      await resolveActionResult(completeFollowUpAction({ id }));
      toast.success("Relance completee");
      void fetchFollowUps();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de la completion",
      );
    }
  };

  const handleDelete = (id: string) => {
    dialogManager.confirm({
      title: "Supprimer la relance",
      description: "Es-tu sur de vouloir supprimer cette relance ?",
      variant: "destructive",
      action: {
        label: "Supprimer",
        variant: "destructive",
        onClick: async () => {
          await resolveActionResult(deleteFollowUpAction({ id }));
          toast.success("Relance supprimee");
          void fetchFollowUps();
        },
      },
      cancel: { label: "Annuler" },
    });
  };

  const handleSnooze = async () => {
    if (!snoozeTargetId || !snoozeDate) return;
    try {
      await resolveActionResult(
        snoozeFollowUpAction({
          id: snoozeTargetId,
          scheduledAt: new Date(snoozeDate),
        }),
      );
      toast.success("Relance reportee");
      setIsSnoozeOpen(false);
      setSnoozeTargetId(null);
      setSnoozeDate("");
      void fetchFollowUps();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur lors du report",
      );
    }
  };

  const toggleTypeFilter = (type: string) => {
    if (typeFilters.includes(type)) {
      void setTypeFilters(typeFilters.filter((t) => t !== type));
    } else {
      void setTypeFilters([...typeFilters, type]);
    }
  };

  return (
    <Layout size="lg">
      <LayoutHeader>
        <LayoutTitle>Relances</LayoutTitle>
      </LayoutHeader>
      <LayoutActions>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setIsCreateOpen(true)}>
            <Plus className="size-4" />
            Nouvelle relance
          </Button>
          <Button
            variant={view === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => void setView("list")}
          >
            <List className="size-4" />
            Liste
          </Button>
          <Button
            variant={view === "calendar" ? "default" : "outline"}
            size="sm"
            onClick={() => void setView("calendar")}
          >
            <CalendarDays className="size-4" />
            Calendrier
          </Button>
        </div>
      </LayoutActions>

      <LayoutContent className="flex flex-col gap-4">
        {view === "list" && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              {Object.entries(FOLLOW_UP_TYPE_LABELS).map(([value, label]) => (
                <Badge
                  key={value}
                  variant={typeFilters.includes(value) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleTypeFilter(value)}
                >
                  {label}
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              {STATUS_FILTERS.map((sf) => (
                <Badge
                  key={sf.value}
                  variant={statusFilter === sf.value ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() =>
                    void setStatusFilter(
                      statusFilter === sf.value ? "" : sf.value,
                    )
                  }
                >
                  {sf.label}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : view === "list" ? (
          filteredFollowUps.length === 0 ? (
            <EmptyState
              icon={List}
              title="Aucune relance"
              description="Tu n'as pas encore de relances planifiees."
              action={{
                label: "Creer une relance",
                onClick: () => setIsCreateOpen(true),
              }}
            />
          ) : (
            Object.entries(groupedFollowUps).map(([dateKey, dayFollowUps]) => (
              <div key={dateKey} className="flex flex-col gap-3">
                <Typography
                  variant="h3"
                  className="text-muted-foreground text-base"
                >
                  {dateKey}
                </Typography>
                {dayFollowUps.map((fu) => {
                  const status = getFollowUpStatus(fu);
                  const TypeIcon = FOLLOW_UP_TYPE_ICONS[fu.type] ?? Mail;
                  return (
                    <div
                      key={fu.id}
                      className="border-border bg-card hover:bg-accent flex cursor-pointer flex-col gap-2 rounded-lg border p-4 transition-colors"
                      onClick={() => setEditingFollowUp(fu)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <TypeIcon className="text-muted-foreground mt-0.5 size-4" />
                          <div className="flex flex-col gap-1">
                            <Typography variant="large">{fu.title}</Typography>
                            <Typography
                              variant="muted"
                              className="text-muted-foreground"
                            >
                              {fu.mission.title}
                              {fu.mission.company && ` • ${fu.mission.company}`}
                            </Typography>
                          </div>
                        </div>
                        <div
                          className="flex items-center gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {status === "completed" && (
                            <Badge
                              variant="secondary"
                              className="text-green-600 dark:text-green-400"
                            >
                              Completee
                            </Badge>
                          )}
                          {status === "overdue" && (
                            <Badge variant="destructive">En retard</Badge>
                          )}
                          <div className="bg-muted text-muted-foreground rounded-full px-2 py-1 text-xs font-semibold">
                            {FOLLOW_UP_TYPE_LABELS[fu.type] ?? fu.type}
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8"
                              >
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => setEditingFollowUp(fu)}
                              >
                                <Pencil className="mr-2 size-4" />
                                Modifier
                              </DropdownMenuItem>
                              {!fu.completedAt && (
                                <DropdownMenuItem
                                  onClick={() => void handleComplete(fu.id)}
                                >
                                  <CheckCircle2 className="mr-2 size-4" />
                                  Completer
                                </DropdownMenuItem>
                              )}
                              {!fu.completedAt && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSnoozeTargetId(fu.id);
                                    setIsSnoozeOpen(true);
                                  }}
                                >
                                  <Clock className="mr-2 size-4" />
                                  Reporter
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => handleDelete(fu.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 size-4" />
                                Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )
        ) : (
          <FollowUpCalendar followUps={filteredFollowUps} />
        )}
      </LayoutContent>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle relance</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Mission *</label>
              <Select
                value={selectedMissionId}
                onValueChange={setSelectedMissionId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selectionner une mission..." />
                </SelectTrigger>
                <SelectContent>
                  {missions.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.title}
                      {m.company ? ` - ${m.company}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <FollowUpForm
              onSubmit={handleCreate}
              onCancel={() => {
                setIsCreateOpen(false);
                setSelectedMissionId("");
              }}
              submitLabel="Creer la relance"
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editingFollowUp !== null}
        onOpenChange={(open) => {
          if (!open) setEditingFollowUp(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier la relance</DialogTitle>
          </DialogHeader>
          {editingFollowUp && (
            <FollowUpForm
              key={editingFollowUp.id}
              defaultValues={{
                type: editingFollowUp.type as CreateFollowUpInput["type"],
                title: editingFollowUp.title,
                scheduledAt: new Date(editingFollowUp.scheduledAt),
              }}
              onSubmit={handleEdit}
              onCancel={() => setEditingFollowUp(null)}
              submitLabel="Enregistrer"
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isSnoozeOpen} onOpenChange={setIsSnoozeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reporter la relance</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Nouvelle date</label>
              <Input
                type="datetime-local"
                value={snoozeDate}
                onChange={(e) => setSnoozeDate(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsSnoozeOpen(false);
                  setSnoozeTargetId(null);
                  setSnoozeDate("");
                }}
              >
                Annuler
              </Button>
              <Button
                onClick={() => void handleSnooze()}
                disabled={!snoozeDate}
              >
                Reporter
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
