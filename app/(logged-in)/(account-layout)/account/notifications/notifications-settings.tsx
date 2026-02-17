"use client";

import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  getPreferencesAction,
  updatePreferencesAction,
} from "@/features/settings/settings.action";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { PushToggle } from "@/features/notifications/push/components/push-toggle";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type NotificationPrefs = {
  notifyFollowUpDue: boolean;
  notifyMissionStale: boolean;
  notifyAiQuota: boolean;
  weeklyDigest: boolean;
  pushFollowUpDue: boolean;
  pushMissionStale: boolean;
  pushAiQuota: boolean;
  pushWeeklyDigest: boolean;
};

export function NotificationsSettings() {
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [isPushEnabled, setIsPushEnabled] = useState(false);

  useEffect(() => {
    resolveActionResult(getPreferencesAction())
      .then((result) => {
        setPrefs({
          notifyFollowUpDue: result.notifyFollowUpDue,
          notifyMissionStale: result.notifyMissionStale,
          notifyAiQuota: result.notifyAiQuota,
          weeklyDigest: result.weeklyDigest,
          pushFollowUpDue: result.pushFollowUpDue,
          pushMissionStale: result.pushMissionStale,
          pushAiQuota: result.pushAiQuota,
          pushWeeklyDigest: result.pushWeeklyDigest,
        });
      })
      .catch(() => toast.error("Erreur lors du chargement des préférences"))
      .finally(() => setIsLoading(false));
  }, []);

  const updatePref = (update: Partial<NotificationPrefs>) => {
    if (!prefs) return;

    const newPrefs = { ...prefs, ...update };
    setPrefs(newPrefs);

    startTransition(async () => {
      try {
        await resolveActionResult(updatePreferencesAction(update));
      } catch {
        setPrefs(prefs);
        toast.error("Erreur lors de la sauvegarde");
      }
    });
  };

  if (isLoading) {
    return <Skeleton className="h-60 w-full rounded-xl" />;
  }

  if (!prefs) {
    return (
      <p className="text-muted-foreground">
        Impossible de charger les préférences.
      </p>
    );
  }

  const notificationRows = [
    {
      label: "Relances à faire",
      emailKey: "notifyFollowUpDue" as const,
      pushKey: "pushFollowUpDue" as const,
    },
    {
      label: "Missions inactives",
      emailKey: "notifyMissionStale" as const,
      pushKey: "pushMissionStale" as const,
    },
    {
      label: "Quota IA",
      emailKey: "notifyAiQuota" as const,
      pushKey: "pushAiQuota" as const,
    },
    {
      label: "Résumé hebdomadaire",
      emailKey: "weeklyDigest" as const,
      pushKey: "pushWeeklyDigest" as const,
    },
  ];

  return (
    <Card className="flex flex-col gap-4 p-6">
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-semibold">Notifications</h3>
        {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
      </div>

      <PushToggle onStatusChange={setIsPushEnabled} />

      <div className="mt-2 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-muted-foreground border-b">
              <th className="pb-2 text-left font-medium">Type</th>
              <th className="pb-2 text-center font-medium">Email</th>
              <th className="pb-2 text-center font-medium">Push</th>
            </tr>
          </thead>
          <tbody>
            {notificationRows.map((row) => (
              <tr key={row.emailKey} className="border-b last:border-0">
                <td className="py-3">
                  <Label>{row.label}</Label>
                </td>
                <td className="py-3 text-center">
                  <Switch
                    checked={prefs[row.emailKey]}
                    onCheckedChange={(v) => updatePref({ [row.emailKey]: v })}
                  />
                </td>
                <td className="py-3 text-center">
                  <Switch
                    checked={prefs[row.pushKey]}
                    disabled={!isPushEnabled}
                    onCheckedChange={(v) => updatePref({ [row.pushKey]: v })}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
