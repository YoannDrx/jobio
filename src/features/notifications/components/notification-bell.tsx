"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import type { Notification } from "@/generated/prisma";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { dayjs } from "@/lib/dayjs";
import { Bell, CheckCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  getNotificationsAction,
  markAllAsReadAction,
  markAsReadAction,
} from "../notifications.action";

export function NotificationBell() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const result = await resolveActionResult(getNotificationsAction());
      setNotifications(result.notifications);
      setUnreadCount(result.unreadCount);
    } catch {
      // Silently fail - notifications are non-critical
    }
  }, []);

  useEffect(() => {
    void fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (open) {
      void fetchNotifications();
    }
  }, [open, fetchNotifications]);

  const handleMarkAsRead = useCallback(
    async (notification: Notification) => {
      try {
        await resolveActionResult(markAsReadAction({ id: notification.id }));
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, read: true } : n,
          ),
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));

        if (notification.link) {
          setOpen(false);
          router.push(notification.link);
        }
      } catch {
        // Silently fail
      }
    },
    [router],
  );

  const handleMarkAllAsRead = useCallback(async () => {
    setLoading(true);
    try {
      await resolveActionResult(markAllAsReadAction());
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full p-0 text-[10px]"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between p-3">
          <p className="text-sm font-semibold">Notifications</p>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto px-2 py-1 text-xs"
              disabled={loading}
              onClick={() => void handleMarkAllAsRead()}
            >
              <CheckCheck className="mr-1 size-3" />
              Tout marquer comme lu
            </Button>
          )}
        </div>
        <Separator />
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-6 text-center">
              <Bell className="text-muted-foreground mb-2 size-8" />
              <p className="text-muted-foreground text-sm">
                Aucune notification
              </p>
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  className="hover:bg-accent flex w-full cursor-pointer items-start gap-3 px-3 py-2.5 text-left transition-colors"
                  onClick={() => void handleMarkAsRead(notification)}
                >
                  {!notification.read && (
                    <span className="bg-primary mt-1.5 size-2 shrink-0 rounded-full" />
                  )}
                  <div
                    className={`flex min-w-0 flex-1 flex-col gap-0.5 ${notification.read ? "pl-5" : ""}`}
                  >
                    <p className="truncate text-sm font-medium">
                      {notification.title}
                    </p>
                    <p className="text-muted-foreground line-clamp-2 text-xs">
                      {notification.message}
                    </p>
                    <p className="text-muted-foreground text-[10px]">
                      {dayjs(notification.createdAt).fromNow()}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
