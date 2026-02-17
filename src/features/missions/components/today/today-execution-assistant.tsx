"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { cn } from "@/lib/utils";
import { batchCreateFollowUpsAction } from "@/features/follow-ups/follow-ups.action";
import { generateTodayStrategyAction } from "@/features/ai/generate-today-strategy.action";
import {
  deleteStrategyAction,
  getTodayStrategyAction,
  toggleStrategyItemAction,
} from "@/features/ai/daily-strategy.action";
import { dialogManager } from "@/features/dialog-manager/dialog-manager";
import { AlertTriangle, Bot, Sparkles, Trash2, Zap } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type BatchCandidate = {
  id: string;
  title: string;
  company: string | null;
  daysWithoutFollowUp: number;
};

type TodayExecutionAssistantProps = {
  batchCandidates: BatchCandidate[];
};

type Strategy = {
  id: string;
  summary: string;
  priorities: string[];
  quickWins: string[];
  risks: string[];
  completedPriorities: number[];
  completedQuickWins: number[];
};

export function TodayExecutionAssistant({
  batchCandidates,
}: TodayExecutionAssistantProps) {
  const router = useRouter();
  const [isBatching, setIsBatching] = useState(false);
  const [isGeneratingStrategy, setIsGeneratingStrategy] = useState(false);
  const [strategy, setStrategy] = useState<Strategy | null>(null);

  useEffect(() => {
    void resolveActionResult(getTodayStrategyAction()).then((result) => {
      if (result) {
        setStrategy({
          id: result.id,
          summary: result.summary,
          priorities: result.priorities as string[],
          quickWins: result.quickWins as string[],
          risks: result.risks as string[],
          completedPriorities: result.completedPriorities as number[],
          completedQuickWins: result.completedQuickWins as number[],
        });
      }
    });
  }, []);

  const prioritizedCandidates = useMemo(
    () =>
      [...batchCandidates]
        .sort((a, b) => b.daysWithoutFollowUp - a.daysWithoutFollowUp)
        .slice(0, 6),
    [batchCandidates],
  );

  const handleBatchPlan = () => {
    if (prioritizedCandidates.length === 0) {
      toast.info("Aucune mission éligible pour une relance batch");
      return;
    }

    dialogManager.confirm({
      title: "Planifier les relances",
      description: `Planifier une relance sur ${prioritizedCandidates.length} mission(s) demain à 09:30 ?`,
      action: {
        label: "Planifier",
        onClick: async () => {
          setIsBatching(true);
          try {
            const nextBusinessMorning = new Date();
            nextBusinessMorning.setDate(nextBusinessMorning.getDate() + 1);
            nextBusinessMorning.setHours(9, 30, 0, 0);

            const result = await resolveActionResult(
              batchCreateFollowUpsAction({
                missionIds: prioritizedCandidates.map(
                  (candidate) => candidate.id,
                ),
                type: "EMAIL",
                title: "Relance de suivi",
                description:
                  "Relance planifiée automatiquement par l'assistant d'exécution.",
                scheduledAt: nextBusinessMorning,
                skipIfPendingWithinDays: 7,
              }),
            );

            toast.success(
              `${result.createdCount} relance(s) planifiée(s), ${result.skippedCount} ignorée(s)`,
            );
            router.refresh();
          } catch (error) {
            toast.error(
              error instanceof Error
                ? error.message
                : "Impossible de planifier les relances batch",
            );
          } finally {
            setIsBatching(false);
          }
        },
      },
      cancel: { label: "Annuler" },
    });
  };

  const generateStrategy = async () => {
    setIsGeneratingStrategy(true);
    try {
      const result = await resolveActionResult(generateTodayStrategyAction({}));
      setStrategy({
        id: result.id,
        summary: result.summary,
        priorities: result.priorities as string[],
        quickWins: result.quickWins as string[],
        risks: result.risks as string[],
        completedPriorities: result.completedPriorities as number[],
        completedQuickWins: result.completedQuickWins as number[],
      });
      toast.success("Stratégie IA générée");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Impossible de générer une stratégie IA",
      );
    } finally {
      setIsGeneratingStrategy(false);
    }
  };

  const handleGenerateStrategy = () => {
    if (strategy) {
      dialogManager.confirm({
        title: "Régénérer la stratégie",
        description: "La stratégie actuelle sera remplacée par une nouvelle.",
        action: {
          label: "Régénérer",
          onClick: async () => {
            await generateStrategy();
          },
        },
        cancel: { label: "Annuler" },
      });
    } else {
      void generateStrategy();
    }
  };

  const handleToggle = async (
    field: "priorities" | "quickWins",
    index: number,
  ) => {
    if (!strategy) return;
    const completedField =
      field === "priorities" ? "completedPriorities" : "completedQuickWins";
    const current = strategy[completedField];
    const updated = current.includes(index)
      ? current.filter((i) => i !== index)
      : [...current, index];
    const prev = { ...strategy };
    setStrategy({ ...strategy, [completedField]: updated });

    try {
      await resolveActionResult(
        toggleStrategyItemAction({ id: strategy.id, field, index }),
      );
    } catch {
      setStrategy(prev);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const handleDelete = () => {
    if (!strategy) return;
    dialogManager.confirm({
      title: "Supprimer la stratégie",
      description:
        "La stratégie du jour sera supprimée. Tu pourras en générer une nouvelle.",
      variant: "destructive",
      action: {
        label: "Supprimer",
        variant: "destructive",
        onClick: async () => {
          try {
            await resolveActionResult(
              deleteStrategyAction({ id: strategy.id }),
            );
            setStrategy(null);
            toast.success("Stratégie supprimée");
          } catch {
            toast.error("Erreur lors de la suppression");
          }
        },
      },
      cancel: { label: "Annuler" },
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="size-4" />
          Assistant d&apos;exécution
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="font-medium">Next best action</p>
            <span className="text-muted-foreground text-xs">
              {prioritizedCandidates.length} mission(s) concernée(s)
            </span>
          </div>
          {prioritizedCandidates.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Aucune mission ne nécessite de relance batch immédiate.
            </p>
          ) : (
            <div className="space-y-2">
              {prioritizedCandidates.map((candidate) => (
                <div
                  key={candidate.id}
                  className="flex items-center justify-between rounded-md border px-2 py-1.5 text-sm"
                >
                  <span className="truncate pr-2">
                    {candidate.title}
                    {candidate.company ? ` · ${candidate.company}` : ""}
                  </span>
                  <span className="text-muted-foreground shrink-0 text-xs">
                    {candidate.daysWithoutFollowUp}j sans relance
                  </span>
                </div>
              ))}
            </div>
          )}
          <Button
            className="mt-3"
            size="sm"
            variant="outline"
            disabled={isBatching || prioritizedCandidates.length === 0}
            onClick={() => void handleBatchPlan()}
          >
            <Zap className="size-4" />
            Planifier des relances batch
          </Button>
        </div>

        <div className="rounded-lg border p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <p className="font-medium">Stratégie prescriptive IA</p>
              {strategy && (
                <Badge variant="secondary" className="text-xs">
                  {strategy.completedPriorities.length +
                    strategy.completedQuickWins.length}
                  /{strategy.priorities.length + strategy.quickWins.length}{" "}
                  faits
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              {strategy && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => void handleDelete()}
                >
                  <Trash2 className="size-4" />
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                disabled={isGeneratingStrategy}
                onClick={() => void handleGenerateStrategy()}
              >
                <Bot className="size-4" />
                Générer
              </Button>
            </div>
          </div>
          {strategy ? (
            <div className="space-y-3 text-sm">
              <p className="text-muted-foreground">{strategy.summary}</p>
              {strategy.priorities.length > 0 ? (
                <div>
                  <p className="mb-1 font-medium">Priorités</p>
                  <ul className="space-y-1">
                    {strategy.priorities.map((item, index) => (
                      <li
                        key={index}
                        className="flex items-center gap-2 rounded-md border px-2 py-1.5"
                      >
                        <Checkbox
                          checked={strategy.completedPriorities.includes(index)}
                          onCheckedChange={() =>
                            void handleToggle("priorities", index)
                          }
                        />
                        <span
                          className={cn(
                            "text-sm",
                            strategy.completedPriorities.includes(index) &&
                              "text-muted-foreground line-through",
                          )}
                        >
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {strategy.quickWins.length > 0 ? (
                <div>
                  <p className="mb-1 font-medium">Quick wins</p>
                  <ul className="space-y-1">
                    {strategy.quickWins.map((item, index) => (
                      <li
                        key={index}
                        className="flex items-center gap-2 rounded-md border px-2 py-1.5"
                      >
                        <Checkbox
                          checked={strategy.completedQuickWins.includes(index)}
                          onCheckedChange={() =>
                            void handleToggle("quickWins", index)
                          }
                        />
                        <span
                          className={cn(
                            "text-sm",
                            strategy.completedQuickWins.includes(index) &&
                              "text-muted-foreground line-through",
                          )}
                        >
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {strategy.risks.length > 0 ? (
                <div>
                  <p className="mb-1 flex items-center gap-1 font-medium">
                    <AlertTriangle className="size-3.5" />
                    Risques à surveiller
                  </p>
                  <ul className="space-y-1">
                    {strategy.risks.map((item) => (
                      <li key={item} className="rounded-md border px-2 py-1.5">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              Génère une stratégie priorisée basée sur ton pipeline, tes
              relances et ton rythme d&apos;exécution.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
