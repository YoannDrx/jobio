"use client";

import { useEffect, useState, useTransition } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import {
  getPushStatusAction,
  subscribePushAction,
  unsubscribePushAction,
} from "../push-subscription.action";
import { toast } from "sonner";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

type PushToggleProps = {
  onStatusChange?: (enabled: boolean) => void;
};

export function PushToggle({ onStatusChange }: PushToggleProps) {
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      return;
    }

    setSupported(true);

    resolveActionResult(getPushStatusAction())
      .then((result) => {
        setEnabled(result.enabled);
        onStatusChange?.(result.enabled);
      })
      .catch(() => undefined);
  }, [onStatusChange]);

  if (!supported) {
    return null;
  }

  const handleToggle = (checked: boolean) => {
    startTransition(async () => {
      try {
        if (checked) {
          const permission = await Notification.requestPermission();

          if (permission !== "granted") {
            toast.error("Les notifications ont été refusées par le navigateur");
            return;
          }

          const registration = await navigator.serviceWorker.register("/sw.js");
          await navigator.serviceWorker.ready;

          const appServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: appServerKey.buffer as ArrayBuffer,
          });

          const json = subscription.toJSON();

          await resolveActionResult(
            subscribePushAction({
              endpoint: subscription.endpoint,
              p256dh: json.keys?.p256dh ?? "",
              auth: json.keys?.auth ?? "",
            }),
          );

          setEnabled(true);
          onStatusChange?.(true);
          toast.success("Notifications push activées");
        } else {
          const registration =
            await navigator.serviceWorker.getRegistration("/sw.js");

          if (registration) {
            const subscription =
              await registration.pushManager.getSubscription();

            if (subscription) {
              await resolveActionResult(
                unsubscribePushAction({ endpoint: subscription.endpoint }),
              );
              await subscription.unsubscribe();
            }
          }

          setEnabled(false);
          onStatusChange?.(false);
          toast.success("Notifications push désactivées");
        }
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Erreur lors de la modification des notifications",
        );
      }
    });
  };

  return (
    <div className="flex items-center gap-3">
      <Switch
        id="push-notifications"
        checked={enabled}
        onCheckedChange={handleToggle}
        disabled={isPending}
      />
      <Label htmlFor="push-notifications">Notifications push</Label>
    </div>
  );
}
