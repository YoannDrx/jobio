"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import {
  getFollowUpRulesAction,
  createFollowUpRuleAction,
  updateFollowUpRuleAction,
  deleteFollowUpRuleAction,
} from "@/features/follow-ups/follow-up-rules.action";
import { MISSION_STATUS_LABELS } from "@/features/missions/mission-status";
import { Plus, Trash2, Zap } from "lucide-react";
import { toast } from "sonner";

type FollowUpRule = {
  id: string;
  name: string;
  missionStatus: string;
  delayDays: number;
  followUpType: string;
  templateId: string | null;
  isActive: boolean;
  template: { id: string; name: string } | null;
};

const FOLLOW_UP_TYPE_LABELS: Record<string, string> = {
  EMAIL: "Email",
  CALL: "Appel",
  MESSAGE: "Message",
  MEETING: "Réunion",
};

export function FollowUpRulesManager() {
  const [rules, setRules] = useState<FollowUpRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [name, setName] = useState("");
  const [missionStatus, setMissionStatus] = useState("POSTULE");
  const [delayDays, setDelayDays] = useState(3);
  const [followUpType, setFollowUpType] = useState("EMAIL");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchRules = useCallback(async () => {
    try {
      const data = await resolveActionResult(getFollowUpRulesAction({}));
      setRules(data as FollowUpRule[]);
    } catch {
      toast.error("Erreur lors du chargement des règles");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchRules();
  }, [fetchRules]);

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Le nom est requis");
      return;
    }

    setIsSubmitting(true);
    try {
      await resolveActionResult(
        createFollowUpRuleAction({
          name: name.trim(),
          missionStatus: missionStatus as
            | "A_POSTULER"
            | "POSTULE"
            | "ENTRETIEN"
            | "PROPOSITION"
            | "ACCEPTE"
            | "REFUSE"
            | "EN_PAUSE"
            | "ABANDONNE"
            | "ARCHIVE",
          delayDays,
          followUpType: followUpType as
            | "EMAIL"
            | "CALL"
            | "MESSAGE"
            | "MEETING",
          isActive: true,
        }),
      );
      toast.success("Règle créée");
      setIsDialogOpen(false);
      setName("");
      setDelayDays(3);
      void fetchRules();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de la création",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      await resolveActionResult(updateFollowUpRuleAction({ id, isActive }));
      setRules((prev) =>
        prev.map((rule) => (rule.id === id ? { ...rule, isActive } : rule)),
      );
      toast.success(isActive ? "Règle activée" : "Règle désactivée");
    } catch {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await resolveActionResult(deleteFollowUpRuleAction({ id }));
      setRules((prev) => prev.filter((rule) => rule.id !== id));
      toast.success("Règle supprimée");
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex animate-pulse flex-col gap-4">
          <div className="bg-muted h-6 w-48 rounded" />
          <div className="bg-muted h-16 rounded" />
          <div className="bg-muted h-16 rounded" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-amber-500" />
          <h3 className="font-semibold">Règles de relance automatique</h3>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="size-4" />
              Nouvelle règle
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer une règle de relance</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4 pt-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Nom</label>
                <Input
                  placeholder="Ex: Relance post-candidature"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">
                  Quand le statut passe à
                </label>
                <Select value={missionStatus} onValueChange={setMissionStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(MISSION_STATUS_LABELS).map(
                      ([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Délai (jours)</label>
                <Input
                  type="number"
                  min={0}
                  max={365}
                  value={delayDays}
                  onChange={(e) => setDelayDays(Number(e.target.value))}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Type de relance</label>
                <Select value={followUpType} onValueChange={setFollowUpType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(FOLLOW_UP_TYPE_LABELS).map(
                      ([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleCreate}
                disabled={isSubmitting || !name.trim()}
              >
                {isSubmitting ? "Création..." : "Créer la règle"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {rules.length === 0 ? (
        <div className="text-muted-foreground py-8 text-center text-sm">
          Aucune règle de relance configurée. Créez une règle pour automatiser
          vos relances.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="border-border flex items-center justify-between rounded-lg border p-3"
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{rule.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {
                      MISSION_STATUS_LABELS[
                        rule.missionStatus as keyof typeof MISSION_STATUS_LABELS
                      ]
                    }
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {FOLLOW_UP_TYPE_LABELS[rule.followUpType]}
                  </Badge>
                </div>
                <span className="text-muted-foreground text-xs">
                  Déclenché {rule.delayDays}j après le changement de statut
                  {rule.template ? ` - Template: ${rule.template.name}` : ""}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={rule.isActive}
                  onCheckedChange={async (checked) => handleToggle(rule.id, checked)}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  onClick={async () => handleDelete(rule.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
