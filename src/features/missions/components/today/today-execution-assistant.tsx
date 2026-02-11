"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { batchCreateFollowUpsAction } from "@/features/follow-ups/follow-ups.action";
import { generateTodayStrategyAction } from "@/features/ai/generate-today-strategy.action";
import { Sparkles, Zap, Bot, AlertTriangle } from "lucide-react";
import { useMemo, useState } from "react";
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
  summary: string;
  priorities: string[];
  quickWins: string[];
  risks: string[];
};

export function TodayExecutionAssistant({
  batchCandidates,
}: TodayExecutionAssistantProps) {
  const router = useRouter();
  const [isBatching, setIsBatching] = useState(false);
  const [isGeneratingStrategy, setIsGeneratingStrategy] = useState(false);
  const [strategy, setStrategy] = useState<Strategy | null>(null);

  const prioritizedCandidates = useMemo(
    () =>
      [...batchCandidates]
        .sort((a, b) => b.daysWithoutFollowUp - a.daysWithoutFollowUp)
        .slice(0, 6),
    [batchCandidates],
  );

  const handleBatchPlan = async () => {
    if (prioritizedCandidates.length === 0) {
      toast.info("Aucune mission éligible pour une relance batch");
      return;
    }

    const confirmation = window.confirm(
      `Planifier une relance sur ${prioritizedCandidates.length} mission(s) demain à 09:30 ?`,
    );

    if (!confirmation) {
      return;
    }

    setIsBatching(true);
    try {
      const nextBusinessMorning = new Date();
      nextBusinessMorning.setDate(nextBusinessMorning.getDate() + 1);
      nextBusinessMorning.setHours(9, 30, 0, 0);

      const result = await resolveActionResult(
        batchCreateFollowUpsAction({
          missionIds: prioritizedCandidates.map((candidate) => candidate.id),
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
  };

  const handleGenerateStrategy = async () => {
    setIsGeneratingStrategy(true);
    try {
      const result = await resolveActionResult(generateTodayStrategyAction({}));
      setStrategy(result);
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
            <p className="font-medium">Stratégie prescriptive IA</p>
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
          {strategy ? (
            <div className="space-y-3 text-sm">
              <p className="text-muted-foreground">{strategy.summary}</p>
              {strategy.priorities.length > 0 ? (
                <div>
                  <p className="mb-1 font-medium">Priorités</p>
                  <ul className="space-y-1">
                    {strategy.priorities.map((item) => (
                      <li key={item} className="rounded-md border px-2 py-1.5">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {strategy.quickWins.length > 0 ? (
                <div>
                  <p className="mb-1 font-medium">Quick wins</p>
                  <ul className="space-y-1">
                    {strategy.quickWins.map((item) => (
                      <li key={item} className="rounded-md border px-2 py-1.5">
                        {item}
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
              Génère une stratégie priorisée basée sur ton pipeline, tes relances et
              ton rythme d&apos;exécution.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

