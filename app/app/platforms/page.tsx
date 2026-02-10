"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/nowts/empty-state";
import { Input } from "@/components/ui/input";
import {
  Layout,
  LayoutContent,
  LayoutHeader,
  LayoutTitle,
} from "@/features/page/layout";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import {
  addUserPlatformAction,
  getPlatformsAction,
  getUserPlatformsAction,
  removeUserPlatformAction,
  updateUserPlatformAction,
} from "@/features/platforms/platforms.action";
import { ExternalLink, Globe, Loader2, Minus, Plus } from "lucide-react";
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

export default function PlatformsPage() {
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [userPlatforms, setUserPlatforms] = useState<UserPlatform[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingPlatformId, setLoadingPlatformId] = useState<string | null>(
    null,
  );
  const [editingUrl, setEditingUrl] = useState<Record<string, string>>({});

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

  return (
    <Layout size="lg">
      <LayoutHeader>
        <LayoutTitle>Plateformes</LayoutTitle>
      </LayoutHeader>

      <LayoutContent>
        {isLoading ? (
          <div className="text-muted-foreground py-12 text-center text-sm">
            Chargement...
          </div>
        ) : platforms.length === 0 ? (
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
                                cycleStatus(
                                  userPlatform.id,
                                  userPlatform.status,
                                )
                              }
                              className="cursor-pointer"
                            >
                              <PlatformStatusBadge
                                status={userPlatform.status}
                              />
                            </button>
                          )}
                        </div>
                      </div>
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
                      <div className="flex items-center gap-2">
                        <Input
                          type="url"
                          placeholder="URL de votre profil"
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
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </LayoutContent>
    </Layout>
  );
}
