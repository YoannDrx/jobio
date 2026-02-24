"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/nowts/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Layout,
  LayoutActions,
  LayoutContent,
  LayoutHeader,
  LayoutTitle,
} from "@/features/page/layout";
import {
  deleteAllReadAction,
  deleteNotificationAction,
  getAllNotificationsAction,
  markAllAsReadAction,
  markAsReadAction,
} from "@/features/notifications/notifications.action";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { dayjs } from "@/lib/dayjs";
import type { Notification, NotificationType } from "@/generated/prisma";
import {
  Bell,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useQueryState, parseAsInteger, parseAsString } from "nuqs";
import { toast } from "sonner";

const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  FOLLOW_UP_DUE: "Relance due",
  FOLLOW_UP_OVERDUE: "Relance en retard",
  MISSION_STALE: "Mission inactive",
  AI_QUOTA_HIGH: "Quota IA",
  SYSTEM: "Système",
  BILLING_INVOICE_OVERDUE: "Facture en retard",
};

const ALL_TYPES: NotificationType[] = [
  "FOLLOW_UP_DUE",
  "FOLLOW_UP_OVERDUE",
  "MISSION_STALE",
  "AI_QUOTA_HIGH",
  "SYSTEM",
  "BILLING_INVOICE_OVERDUE",
];

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [typeFilter, setTypeFilter] = useQueryState(
    "type",
    parseAsString.withDefault(""),
  );
  const [readStatus, setReadStatus] = useQueryState(
    "status",
    parseAsString.withDefault("all"),
  );
  const pageSize = 20;

  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await resolveActionResult(
        getAllNotificationsAction({
          page,
          pageSize,
          type: typeFilter ? (typeFilter as NotificationType) : undefined,
          readStatus: readStatus as "all" | "read" | "unread",
        }),
      );
      setNotifications(result.notifications);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur lors du chargement",
      );
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, typeFilter, readStatus]);

  useEffect(() => {
    void fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (notification: Notification) => {
    try {
      await resolveActionResult(markAsReadAction({ id: notification.id }));
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n)),
      );
      if (notification.link) {
        router.push(notification.link);
      }
    } catch {
      toast.error("Erreur lors du marquage");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await resolveActionResult(markAllAsReadAction());
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success("Toutes les notifications marquées comme lues");
    } catch {
      toast.error("Erreur lors du marquage");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await resolveActionResult(deleteNotificationAction({ id }));
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setTotal((prev) => prev - 1);
      toast.success("Notification supprimée");
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleDeleteAllRead = async () => {
    try {
      await resolveActionResult(deleteAllReadAction());
      toast.success("Notifications lues supprimées");
      void fetchNotifications();
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleTypeFilter = (type: string) => {
    void setTypeFilter(type === typeFilter ? "" : type);
    void setPage(1);
  };

  const handleReadStatus = (status: string) => {
    void setReadStatus(status === readStatus ? "all" : status);
    void setPage(1);
  };

  return (
    <Layout size="lg">
      <LayoutHeader>
        <LayoutTitle>
          Notifications{" "}
          {total > 0 && (
            <span className="text-muted-foreground">({total})</span>
          )}
        </LayoutTitle>
      </LayoutHeader>
      <LayoutActions className="gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => void handleMarkAllAsRead()}
        >
          <CheckCheck className="size-4" />
          Tout marquer lu
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => void handleDeleteAllRead()}
        >
          <Trash2 className="size-4" />
          Supprimer les lues
        </Button>
      </LayoutActions>

      <LayoutContent className="flex flex-col gap-4">
        {/* Filters */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground text-sm">Type :</span>
            {ALL_TYPES.map((type) => (
              <Badge
                key={type}
                variant={typeFilter === type ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => handleTypeFilter(type)}
              >
                {NOTIFICATION_TYPE_LABELS[type]}
              </Badge>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground text-sm">Statut :</span>
            <Badge
              variant={readStatus === "unread" ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => handleReadStatus("unread")}
            >
              Non lues
            </Badge>
            <Badge
              variant={readStatus === "read" ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => handleReadStatus("read")}
            >
              Lues
            </Badge>
          </div>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="Aucune notification"
            description="Tu n'as aucune notification pour le moment."
          />
        ) : (
          <div className="flex flex-col gap-2">
            {notifications.map((notification) => (
              <Card
                key={notification.id}
                className={`flex items-start gap-3 p-4 transition-colors ${
                  !notification.read ? "bg-accent/50 border-primary/20" : ""
                }`}
              >
                <button
                  type="button"
                  className="flex min-w-0 flex-1 cursor-pointer items-start gap-3 text-left"
                  onClick={() => void handleMarkAsRead(notification)}
                >
                  {!notification.read && (
                    <span className="bg-primary mt-1.5 size-2 shrink-0 rounded-full" />
                  )}
                  <div
                    className={`flex min-w-0 flex-1 flex-col gap-1 ${notification.read ? "pl-5" : ""}`}
                  >
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium">
                        {notification.title}
                      </p>
                      <Badge
                        variant="secondary"
                        className="shrink-0 text-[10px]"
                      >
                        {NOTIFICATION_TYPE_LABELS[notification.type]}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      {notification.message}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {dayjs(notification.createdAt).fromNow()}
                    </p>
                  </div>
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive shrink-0"
                  onClick={() => void handleDelete(notification.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </Card>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4">
                <p className="text-muted-foreground text-sm">
                  Page {page} sur {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => void setPage(page - 1)}
                  >
                    <ChevronLeft className="size-4" />
                    Précédent
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => void setPage(page + 1)}
                  >
                    Suivant
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </LayoutContent>
    </Layout>
  );
}
