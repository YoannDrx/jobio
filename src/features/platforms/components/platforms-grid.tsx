"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/nowts/empty-state";
import { Input } from "@/components/ui/input";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import {
  addUserPlatformAction,
  deleteCustomPlatformAction,
  getPlatformsAction,
  getUserPlatformsAction,
  removeUserPlatformAction,
  updateUserPlatformAction,
} from "@/features/platforms/platforms.action";
import { CustomPlatformDialog } from "./custom-platform-dialog";
import {
  Check,
  ChevronDown,
  ExternalLink,
  Globe,
  Loader2,
  Minus,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

type Platform = {
  id: string;
  name: string;
  slug: string;
  website: string | null;
  category: "GENERALIST" | "SPECIALIZED" | "ENTERPRISE";
  description: string | null;
  isSystem: boolean;
  createdAt: Date;
};

type UserPlatform = {
  id: string;
  userId: string;
  platformId: string;
  profileUrl: string | null;
  status: "NOT_REGISTERED" | "REGISTERED" | "ACTIVE";
  createdAt: Date;
  platform: Platform;
};

const PLATFORM_STATUS_CONFIG = {
  NOT_REGISTERED: {
    label: "Non inscrit",
    className:
      "bg-status-neutral/15 text-status-neutral border-status-neutral/30",
  },
  REGISTERED: {
    label: "Inscrit",
    className:
      "bg-status-warning/15 text-status-warning border-status-warning/30",
  },
  ACTIVE: {
    label: "Actif",
    className:
      "bg-status-success/15 text-status-success border-status-success/30",
  },
} as const;

const CATEGORY_LABELS: Record<Platform["category"], string> = {
  GENERALIST: "Généraliste",
  SPECIALIZED: "Spécialisée",
  ENTERPRISE: "Entreprise",
};

type PlatformStatus = keyof typeof PLATFORM_STATUS_CONFIG;

function PlatformStatusBadge({ status }: { status: PlatformStatus }) {
  const config = PLATFORM_STATUS_CONFIG[status];
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}

function getChecklistSteps(userPlatform: UserPlatform) {
  return [
    {
      label: "Compte cree",
      done: userPlatform.status !== "NOT_REGISTERED",
    },
    {
      label: "Profil rempli",
      done: Boolean(userPlatform.profileUrl),
    },
    {
      label: "Portfolio",
      done: userPlatform.status === "ACTIVE",
    },
    {
      label: "Preuves sociales",
      done:
        userPlatform.status === "ACTIVE" && Boolean(userPlatform.profileUrl),
    },
  ];
}

function getProgressColor(completed: number) {
  if (completed <= 1) return "bg-muted-foreground/40";
  if (completed <= 3) return "bg-status-warning";
  return "bg-status-success";
}

function PlatformChecklist({ userPlatform }: { userPlatform: UserPlatform }) {
  const [expanded, setExpanded] = useState(false);
  const steps = getChecklistSteps(userPlatform);
  const completed = steps.filter((s) => s.done).length;
  const total = steps.length;
  const color = getProgressColor(completed);

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="flex cursor-pointer items-center gap-2"
      >
        <div className="bg-muted h-1.5 flex-1 overflow-hidden rounded-full">
          <div
            className={`h-full rounded-full transition-all duration-300 ${color}`}
            style={{ width: `${(completed / total) * 100}%` }}
          />
        </div>
        <span className="text-muted-foreground text-xs whitespace-nowrap">
          {completed}/{total} etapes
        </span>
        <ChevronDown
          className={`text-muted-foreground size-3.5 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      <div
        className={`grid transition-all duration-200 ease-in-out ${expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
      >
        <div className="overflow-hidden">
          <ul className="flex flex-col gap-1 pt-1">
            {steps.map((step) => (
              <li key={step.label} className="flex items-center gap-2 text-xs">
                {step.done ? (
                  <Check className="text-status-success size-3.5" />
                ) : (
                  <X className="text-muted-foreground size-3.5" />
                )}
                <span
                  className={
                    step.done ? "text-foreground" : "text-muted-foreground"
                  }
                >
                  {step.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export function PlatformsGrid() {
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [userPlatforms, setUserPlatforms] = useState<UserPlatform[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingPlatformId, setLoadingPlatformId] = useState<string | null>(
    null,
  );
  const [editingUrl, setEditingUrl] = useState<Record<string, string>>({});
  const [customDialogOpen, setCustomDialogOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [allPlatforms, userPlats] = await Promise.all([
        resolveActionResult(getPlatformsAction()),
        resolveActionResult(getUserPlatformsAction()),
      ]);
      setPlatforms(allPlatforms);
      setUserPlatforms(userPlats);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur lors du chargement",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const getUserPlatform = (platformId: string) =>
    userPlatforms.find((up) => up.platformId === platformId);

  const handleAdd = async (platformId: string) => {
    try {
      setLoadingPlatformId(platformId);
      await resolveActionResult(addUserPlatformAction({ platformId }));
      toast.success("Plateforme ajoutée");
      void fetchData();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de l'ajout",
      );
    } finally {
      setLoadingPlatformId(null);
    }
  };

  const handleRemove = async (userPlatformId: string) => {
    try {
      setLoadingPlatformId(userPlatformId);
      await resolveActionResult(
        removeUserPlatformAction({ id: userPlatformId }),
      );
      toast.success("Plateforme retirée");
      void fetchData();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors de la suppression",
      );
    } finally {
      setLoadingPlatformId(null);
    }
  };

  const handleDeleteCustom = async (platformId: string) => {
    try {
      setLoadingPlatformId(platformId);
      await resolveActionResult(deleteCustomPlatformAction({ id: platformId }));
      toast.success("Plateforme supprimée");
      void fetchData();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors de la suppression",
      );
    } finally {
      setLoadingPlatformId(null);
    }
  };

  const handleUpdateStatus = async (
    userPlatformId: string,
    status: PlatformStatus,
  ) => {
    try {
      await resolveActionResult(
        updateUserPlatformAction({ id: userPlatformId, status }),
      );
      toast.success("Statut mis à jour");
      void fetchData();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors de la mise à jour",
      );
    }
  };

  const handleUpdateProfileUrl = async (
    userPlatformId: string,
    profileUrl: string,
  ) => {
    if (!profileUrl) return;
    try {
      await resolveActionResult(
        updateUserPlatformAction({ id: userPlatformId, profileUrl }),
      );
      toast.success("URL du profil mise à jour");
      void fetchData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "URL invalide");
    }
  };

  const statusCycle: PlatformStatus[] = [
    "NOT_REGISTERED",
    "REGISTERED",
    "ACTIVE",
  ];

  const cycleStatus = (
    userPlatformId: string,
    currentStatus: PlatformStatus,
  ) => {
    const currentIndex = statusCycle.indexOf(currentStatus);
    const nextStatus = statusCycle[(currentIndex + 1) % statusCycle.length];
    void handleUpdateStatus(userPlatformId, nextStatus);
  };

  if (isLoading) {
    return (
      <div className="text-muted-foreground py-12 text-center text-sm">
        Chargement...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button onClick={() => setCustomDialogOpen(true)} size="sm">
          <Plus className="mr-1 size-4" />
          Ajouter une plateforme
        </Button>
      </div>

      {platforms.length === 0 ? (
        <EmptyState
          icon={Globe}
          title="Aucune plateforme disponible"
          description="Les plateformes seront bientôt disponibles."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {platforms.map((platform) => {
            const userPlatform = getUserPlatform(platform.id);
            const isAdded = Boolean(userPlatform);
            const isLoadingThis =
              loadingPlatformId === platform.id ||
              loadingPlatformId === userPlatform?.id;

            return (
              <Card key={platform.id} className="gap-4 py-4">
                <CardHeader className="pb-0">
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col gap-1">
                      <CardTitle className="flex items-center gap-2">
                        {platform.name}
                        {platform.website && (
                          <a
                            href={platform.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <ExternalLink className="size-3.5" />
                          </a>
                        )}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {CATEGORY_LABELS[platform.category]}
                        </Badge>
                        {isAdded && userPlatform && (
                          <button
                            onClick={() =>
                              cycleStatus(userPlatform.id, userPlatform.status)
                            }
                            className="cursor-pointer"
                          >
                            <PlatformStatusBadge status={userPlatform.status} />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {!platform.isSystem && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive size-8"
                          disabled={isLoadingThis}
                          onClick={() => void handleDeleteCustom(platform.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant={isAdded ? "destructive" : "default"}
                        className="size-8 shrink-0"
                        disabled={isLoadingThis}
                        onClick={async () =>
                          isAdded && userPlatform
                            ? handleRemove(userPlatform.id)
                            : handleAdd(platform.id)
                        }
                      >
                        {isLoadingThis ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : isAdded ? (
                          <Minus className="size-4" />
                        ) : (
                          <Plus className="size-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {platform.description && (
                  <CardContent className="py-0">
                    <p className="text-muted-foreground text-sm">
                      {platform.description}
                    </p>
                  </CardContent>
                )}

                {isAdded && userPlatform && (
                  <CardContent className="py-0">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-2">
                        <Input
                          type="url"
                          placeholder="URL de ton profil"
                          className="h-8 text-sm"
                          defaultValue={userPlatform.profileUrl ?? ""}
                          onChange={(e) =>
                            setEditingUrl((prev) => ({
                              ...prev,
                              [userPlatform.id]: e.target.value,
                            }))
                          }
                          onBlur={() => {
                            const url = editingUrl[userPlatform.id] as
                              | string
                              | undefined;
                            if (
                              url !== undefined &&
                              url !== (userPlatform.profileUrl ?? "")
                            ) {
                              void handleUpdateProfileUrl(userPlatform.id, url);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              const url = editingUrl[userPlatform.id] as
                                | string
                                | undefined;
                              if (
                                url !== undefined &&
                                url !== (userPlatform.profileUrl ?? "")
                              ) {
                                void handleUpdateProfileUrl(
                                  userPlatform.id,
                                  url,
                                );
                              }
                            }
                          }}
                        />
                        {userPlatform.profileUrl && (
                          <a
                            href={userPlatform.profileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <ExternalLink className="size-4" />
                          </a>
                        )}
                      </div>
                      <PlatformChecklist userPlatform={userPlatform} />
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <CustomPlatformDialog
        open={customDialogOpen}
        onOpenChange={setCustomDialogOpen}
        onSuccess={() => void fetchData()}
      />
    </div>
  );
}
