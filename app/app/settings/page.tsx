"use client";

import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Layout,
  LayoutContent,
  LayoutHeader,
  LayoutTitle,
} from "@/features/page/layout";
import {
  getPreferencesAction,
  updatePreferencesAction,
} from "@/features/settings/settings.action";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { PushToggle } from "@/features/notifications/push/components/push-toggle";
import { useEffect, useState, useTransition } from "react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type Prefs = {
  locale: string;
  theme: string;
  notifyFollowUpDue: boolean;
  notifyMissionStale: boolean;
  notifyAiQuota: boolean;
  weeklyDigest: boolean;
  pushFollowUpDue: boolean;
  pushMissionStale: boolean;
  pushAiQuota: boolean;
  pushWeeklyDigest: boolean;
};

export default function SettingsPage() {
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [isPushEnabled, setIsPushEnabled] = useState(false);
  const { setTheme: setNextTheme } = useTheme();

  useEffect(() => {
    resolveActionResult(getPreferencesAction())
      .then((result) => {
        setPrefs({
          locale: result.locale,
          theme: result.theme,
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
      .catch(() => toast.error("Erreur lors du chargement des preferences"))
      .finally(() => setIsLoading(false));
  }, []);

  const updatePref = (update: Partial<Prefs>) => {
    if (!prefs) return;

    const newPrefs = { ...prefs, ...update };
    setPrefs(newPrefs);

    if (update.theme) setNextTheme(update.theme);

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
    return (
      <Layout>
        <LayoutHeader>
          <LayoutTitle>Parametres</LayoutTitle>
        </LayoutHeader>
        <LayoutContent>
          <div className="flex flex-col gap-4">
            <Skeleton className="h-40 w-full rounded-xl" />
            <Skeleton className="h-60 w-full rounded-xl" />
          </div>
        </LayoutContent>
      </Layout>
    );
  }

  if (!prefs) {
    return (
      <Layout>
        <LayoutHeader>
          <LayoutTitle>Parametres</LayoutTitle>
        </LayoutHeader>
        <LayoutContent>
          <p className="text-muted-foreground">
            Impossible de charger les preferences.
          </p>
        </LayoutContent>
      </Layout>
    );
  }

  const notificationRows = [
    {
      label: "Relances a faire",
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
      label: "Resume hebdomadaire",
      emailKey: "weeklyDigest" as const,
      pushKey: "pushWeeklyDigest" as const,
    },
  ];

  return (
    <Layout>
      <LayoutHeader>
        <LayoutTitle>
          Parametres
          {isPending ? (
            <Loader2 className="ml-2 inline size-4 animate-spin" />
          ) : null}
        </LayoutTitle>
      </LayoutHeader>
      <LayoutContent>
        <div className="flex flex-col gap-4">
          <Card className="flex flex-col gap-4 p-6">
            <h3 className="text-lg font-semibold">Apparence</h3>
            <div className="flex flex-col gap-2">
              <Label htmlFor="theme">Theme</Label>
              <Select
                value={prefs.theme}
                onValueChange={(value) => updatePref({ theme: value })}
              >
                <SelectTrigger id="theme" className="max-w-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">Systeme</SelectItem>
                  <SelectItem value="light">Clair</SelectItem>
                  <SelectItem value="dark">Sombre</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>

          <Card className="flex flex-col gap-4 p-6">
            <h3 className="text-lg font-semibold">Notifications</h3>

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
                          onCheckedChange={(v) =>
                            updatePref({ [row.emailKey]: v })
                          }
                        />
                      </td>
                      <td className="py-3 text-center">
                        <Switch
                          checked={prefs[row.pushKey]}
                          disabled={!isPushEnabled}
                          onCheckedChange={(v) =>
                            updatePref({ [row.pushKey]: v })
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </LayoutContent>
    </Layout>
  );
}
