"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/nowts/empty-state";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import {
  addUserPlatformAction,
  deleteCustomPlatformAction,
  getPlatformsAction,
  getUserPlatformsAction,
  removeUserPlatformAction,
  updateUserPlatformAction,
} from "@/features/platforms/platforms.action";
import { CustomPlatformSheet } from "./custom-platform-dialog";
import {
  ChevronDown,
  ExternalLink,
  Globe,
  Loader2,
  Minus,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type Platform = {
  id: string;
  name: string;
  slug: string;
  website: string | null;
  logoUrl: string | null;
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

type PlatformStatus = keyof typeof PLATFORM_STATUS_CONFIG;

const CATEGORY_LABELS: Record<Platform["category"], string> = {
  GENERALIST: "Généraliste",
  SPECIALIZED: "Spécialisée",
  ENTERPRISE: "Entreprise",
};

const CHECKLIST_LABELS = [
  "Compte créé",
  "Profil rempli",
  "Portfolio ajouté",
  "Preuves sociales",
];

function getChecklistDefaults(userPlatform: UserPlatform): boolean[] {
  return [
    userPlatform.status !== "NOT_REGISTERED",
    Boolean(userPlatform.profileUrl),
    userPlatform.status === "ACTIVE",
    userPlatform.status === "ACTIVE" && Boolean(userPlatform.profileUrl),
  ];
}

function getStorageKey(userPlatformId: string) {
  return `jobio.platforms.checklist.${userPlatformId}`;
}

function loadChecklist(userPlatform: UserPlatform): boolean[] {
  try {
    const raw = localStorage.getItem(getStorageKey(userPlatform.id));
    if (raw) {
      const parsed = JSON.parse(raw) as boolean[];
      if (Array.isArray(parsed) && parsed.length === 4) return parsed;
    }
  } catch {
    // ignore
  }
  return getChecklistDefaults(userPlatform);
}

function saveChecklist(userPlatformId: string, values: boolean[]) {
  try {
    localStorage.setItem(getStorageKey(userPlatformId), JSON.stringify(values));
  } catch {
    // ignore
  }
}

function PlatformLogo({ platform }: { platform: Platform }) {
  const logoPath = platform.logoUrl ?? `/images/platforms/${platform.slug}.png`;
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div className="bg-muted flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg">
        <span className="text-xs font-semibold">
          {platform.name.slice(0, 2).toUpperCase()}
        </span>
      </div>
    );
  }

  return (
    <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white">
      <Image
        src={logoPath}
        alt={`Logo ${platform.name}`}
        width={40}
        height={40}
        className="object-contain p-1"
        onError={() => setError(true)}
      />
    </div>
  );
}

function PlatformStatusBadge({ status }: { status: PlatformStatus }) {
  const config = PLATFORM_STATUS_CONFIG[status];
  return (
    <Badge
      variant="outline"
      className={`${config.className} cursor-pointer transition-transform duration-150 hover:scale-105`}
    >
      {config.label}
    </Badge>
  );
}

function getProgressColor(completed: number) {
  if (completed <= 1) return "bg-muted-foreground/40";
  if (completed <= 3) return "bg-status-warning";
  return "bg-status-success";
}

function PlatformChecklist({ userPlatform }: { userPlatform: UserPlatform }) {
  const [expanded, setExpanded] = useState(false);
  const [checks, setChecks] = useState<boolean[]>(() =>
    loadChecklist(userPlatform),
  );

  const completed = checks.filter(Boolean).length;
  const total = checks.length;
  const color = getProgressColor(completed);

  const toggleCheck = (index: number) => {
    const next = [...checks];
    next[index] = !next[index];
    setChecks(next);
    saveChecklist(userPlatform.id, next);
  };

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
          {completed}/{total} étapes
        </span>
        <ChevronDown
          className={`text-muted-foreground size-3.5 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      <div
        className={`grid transition-all duration-200 ease-in-out ${expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
      >
        <div className="overflow-hidden">
          <ul className="flex flex-col gap-1.5 pt-1">
            {CHECKLIST_LABELS.map((label, i) => (
              <li key={label} className="flex items-center gap-2 text-xs">
                <Checkbox
                  checked={checks[i]}
                  onCheckedChange={() => toggleCheck(i)}
                  className="size-3.5"
                />
                <span
                  className={
                    checks[i] ? "text-foreground" : "text-muted-foreground"
                  }
                >
                  {label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function CompactUrl({
  url,
  onEdit,
  onDelete,
}: {
  url: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  let display: string;
  try {
    const parsed = new URL(url);
    const path =
      parsed.pathname.length > 15
        ? `${parsed.pathname.slice(0, 15)}...`
        : parsed.pathname;
    display = parsed.host + (path !== "/" ? path : "");
  } catch {
    display = url.length > 30 ? `${url.slice(0, 30)}...` : url;
  }

  return (
    <div className="group flex items-center gap-1.5">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-xs transition-colors"
      >
        <ExternalLink className="size-3.5 shrink-0" />
        <span className="truncate">{display}</span>
      </a>
      <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          onClick={onEdit}
          className="text-muted-foreground hover:text-foreground rounded p-0.5"
        >
          <Pencil className="size-3" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="text-muted-foreground hover:text-destructive rounded p-0.5"
        >
          <X className="size-3" />
        </button>
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
  const [editingUrlMode, setEditingUrlMode] = useState<Record<string, boolean>>(
    {},
  );
  const [customDialogOpen, setCustomDialogOpen] = useState(false);
  const [statusFilters, setStatusFilters] = useState<Set<PlatformStatus>>(
    new Set(),
  );
  const [categoryFilters, setCategoryFilters] = useState<
    Set<Platform["category"]>
  >(new Set());

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
    if (!profileUrl) {
      try {
        await resolveActionResult(
          updateUserPlatformAction({ id: userPlatformId, profileUrl: "" }),
        );
        toast.success("URL supprimée");
        void fetchData();
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Erreur lors de la suppression",
        );
      }
      return;
    }
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

  const toggleStatusFilter = (status: PlatformStatus) => {
    setStatusFilters((prev) => {
      const next = new Set(prev);
      if (next.has(status)) {
        next.delete(status);
      } else {
        next.add(status);
      }
      return next;
    });
  };

  const toggleCategoryFilter = (category: Platform["category"]) => {
    setCategoryFilters((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const filteredPlatforms = useMemo(() => {
    return platforms.filter((platform) => {
      if (categoryFilters.size > 0 && !categoryFilters.has(platform.category)) {
        return false;
      }
      if (statusFilters.size > 0) {
        const up = userPlatforms.find((u) => u.platformId === platform.id);
        const status: PlatformStatus = up ? up.status : "NOT_REGISTERED";
        if (!statusFilters.has(status)) return false;
      }
      return true;
    });
  }, [platforms, userPlatforms, statusFilters, categoryFilters]);

  if (isLoading) {
    return (
      <div className="text-muted-foreground py-12 text-center text-sm">
        Chargement...
      </div>
    );
  }

  const renderProfileUrl = (userPlatform: UserPlatform) => {
    const isEditing = editingUrlMode[userPlatform.id] ?? false;
    const hasUrl = Boolean(userPlatform.profileUrl);

    if (hasUrl && !isEditing) {
      return (
        <CompactUrl
          url={userPlatform.profileUrl ?? ""}
          onEdit={() =>
            setEditingUrlMode((prev) => ({
              ...prev,
              [userPlatform.id]: true,
            }))
          }
          onDelete={() => {
            void handleUpdateProfileUrl(userPlatform.id, "").then(() => {
              void fetchData();
            });
          }}
        />
      );
    }

    return (
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
            const url = editingUrl[userPlatform.id] as string | undefined;
            if (url !== undefined && url !== (userPlatform.profileUrl ?? "")) {
              void handleUpdateProfileUrl(userPlatform.id, url);
            }
            if (hasUrl) {
              setEditingUrlMode((prev) => ({
                ...prev,
                [userPlatform.id]: false,
              }));
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const url = editingUrl[userPlatform.id] as string | undefined;
              if (
                url !== undefined &&
                url !== (userPlatform.profileUrl ?? "")
              ) {
                void handleUpdateProfileUrl(userPlatform.id, url);
              }
              if (hasUrl) {
                setEditingUrlMode((prev) => ({
                  ...prev,
                  [userPlatform.id]: false,
                }));
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
    );
  };

  const renderPlatformCard = (platform: Platform) => {
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
              <CardTitle className="flex items-center gap-3">
                <PlatformLogo platform={platform} />
                <div className="flex flex-col">
                  <span className="flex items-center gap-2">
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
                  </span>
                </div>
              </CardTitle>
              <div className="flex items-center gap-2">
                {isAdded && userPlatform && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() =>
                          cycleStatus(userPlatform.id, userPlatform.status)
                        }
                        className="cursor-pointer"
                      >
                        <PlatformStatusBadge status={userPlatform.status} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      Cliquer pour changer le statut
                    </TooltipContent>
                  </Tooltip>
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
              {renderProfileUrl(userPlatform)}
              <PlatformChecklist userPlatform={userPlatform} />
            </div>
          </CardContent>
        )}
      </Card>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1">
            {(
              Object.entries(PLATFORM_STATUS_CONFIG) as [
                PlatformStatus,
                (typeof PLATFORM_STATUS_CONFIG)[PlatformStatus],
              ][]
            ).map(([key, config]) => (
              <button
                key={key}
                type="button"
                onClick={() => toggleStatusFilter(key)}
                className="cursor-pointer"
              >
                <Badge
                  variant="outline"
                  className={
                    statusFilters.has(key)
                      ? config.className
                      : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
                  }
                >
                  {config.label}
                </Badge>
              </button>
            ))}
          </div>
          <div className="bg-border h-4 w-px" />
          <div className="flex items-center gap-1">
            {(
              Object.entries(CATEGORY_LABELS) as [
                Platform["category"],
                string,
              ][]
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => toggleCategoryFilter(key)}
                className="cursor-pointer"
              >
                <Badge
                  variant="outline"
                  className={
                    categoryFilters.has(key)
                      ? "bg-primary/10 text-primary border-primary/30"
                      : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
                  }
                >
                  {label}
                </Badge>
              </button>
            ))}
          </div>
          <span className="text-muted-foreground text-xs">
            {filteredPlatforms.length} plateforme
            {filteredPlatforms.length !== 1 ? "s" : ""}
          </span>
        </div>
        <Button onClick={() => setCustomDialogOpen(true)} size="sm">
          <Plus className="mr-1 size-4" />
          Ajouter une plateforme
        </Button>
      </div>

      {filteredPlatforms.length === 0 ? (
        <EmptyState
          icon={Globe}
          title="Aucune plateforme disponible"
          description="Les plateformes seront bientôt disponibles."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredPlatforms.map((platform) => renderPlatformCard(platform))}
        </div>
      )}

      <CustomPlatformSheet
        open={customDialogOpen}
        onOpenChange={setCustomDialogOpen}
        onSuccess={() => void fetchData()}
      />
    </div>
  );
}
