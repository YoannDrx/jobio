"use client";

import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getPreferencesAction,
  updatePreferencesAction,
} from "@/features/settings/settings.action";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { useEffect, useState, useTransition } from "react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type AppearancePrefs = {
  locale: string;
  theme: string;
};

export function AppearanceSettings() {
  const [prefs, setPrefs] = useState<AppearancePrefs | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const { setTheme: setNextTheme } = useTheme();

  useEffect(() => {
    resolveActionResult(getPreferencesAction())
      .then((result) => {
        setPrefs({
          locale: result.locale,
          theme: result.theme,
        });
      })
      .catch(() => toast.error("Erreur lors du chargement des préférences"))
      .finally(() => setIsLoading(false));
  }, []);

  const updatePref = (update: Partial<AppearancePrefs>) => {
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
      <div className="flex flex-col gap-4">
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  if (!prefs) {
    return (
      <p className="text-muted-foreground">
        Impossible de charger les préférences.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col gap-4 p-6">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Thème</h3>
          {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="theme">Apparence de l&apos;application</Label>
          <Select
            value={prefs.theme}
            onValueChange={(value) => updatePref({ theme: value })}
          >
            <SelectTrigger id="theme" className="max-w-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="system">Système</SelectItem>
              <SelectItem value="light">Clair</SelectItem>
              <SelectItem value="dark">Sombre</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="flex flex-col gap-4 p-6">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Langue</h3>
          {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="locale">Langue de l&apos;application</Label>
          <Select
            value={prefs.locale}
            onValueChange={(value) => updatePref({ locale: value })}
          >
            <SelectTrigger id="locale" className="max-w-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fr">Français</SelectItem>
              <SelectItem value="en">English</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>
    </div>
  );
}
