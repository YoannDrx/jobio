"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LoadingButton } from "@/features/form/submit-button";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import {
  actOnRecommendationAction,
  dismissRecommendationAction,
  getRecommendationsAction,
  refreshRecommendationsAction,
} from "@/features/ai/learning-loop.action";
import {
  BarChart3,
  Brain,
  Calendar,
  CheckCircle,
  FileText,
  Lightbulb,
  RefreshCw,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type Recommendation = {
  id: string;
  type: string;
  title: string;
  description: string;
  score: number;
  dismissedAt: Date | null;
  actedOnAt: Date | null;
};

const TYPE_ICONS: Record<string, typeof Brain> = {
  PLATFORM_PERF: BarChart3,
  TEMPLATE_PERF: FileText,
  BEST_TIME: Calendar,
  SKILL_GAP: Zap,
  APPROACH_STYLE: Lightbulb,
};

const TYPE_LABELS: Record<string, string> = {
  PLATFORM_PERF: "Plateforme",
  TEMPLATE_PERF: "Template",
  BEST_TIME: "Timing",
  SKILL_GAP: "Competences",
  APPROACH_STYLE: "Mode de travail",
};

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 70
      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
      : score >= 40
        ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
        : "bg-muted text-muted-foreground";

  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>
      {score}%
    </span>
  );
}

export function RecommendationsWidget() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadRecommendations = async () => {
    try {
      const result = await resolveActionResult(getRecommendationsAction());
      setRecommendations(result);
    } catch {
      toast.error("Erreur lors du chargement des recommandations");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadRecommendations();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const result = await resolveActionResult(refreshRecommendationsAction());
      setRecommendations(result);
      toast.success("Recommandations mises a jour");
    } catch {
      toast.error("Erreur lors du rafraichissement");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDismiss = async (id: string) => {
    try {
      await resolveActionResult(dismissRecommendationAction({ id }));
      setRecommendations((prev) => prev.filter((r) => r.id !== id));
    } catch {
      toast.error("Erreur");
    }
  };

  const handleAct = async (id: string) => {
    try {
      await resolveActionResult(actOnRecommendationAction({ id }));
      setRecommendations((prev) => prev.filter((r) => r.id !== id));
      toast.success("Recommandation prise en compte");
    } catch {
      toast.error("Erreur");
    }
  };

  if (isLoading) {
    return (
      <Card className="flex items-center justify-center p-6">
        <div className="text-muted-foreground text-sm">Chargement...</div>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="size-5" />
          <h3 className="text-lg font-semibold">Recommandations IA</h3>
        </div>
        <LoadingButton
          variant="outline"
          size="sm"
          onClick={() => void handleRefresh()}
          loading={isRefreshing}
        >
          <RefreshCw className="mr-1 size-4" />
          Rafraichir
        </LoadingButton>
      </div>

      {recommendations.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 p-8 text-center">
          <Lightbulb className="text-muted-foreground size-10" />
          <p className="text-muted-foreground text-sm">
            Aucune recommandation pour le moment. Continuez a utiliser Jobio
            pour recevoir des insights personnalises.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void handleRefresh()}
          >
            Generer des recommandations
          </Button>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {recommendations.map((rec) => {
            const Icon = TYPE_ICONS[rec.type] ?? Lightbulb;
            const label = TYPE_LABELS[rec.type] ?? rec.type;

            return (
              <Card key={rec.id} className="flex flex-col gap-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3">
                    <div className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-lg">
                      <Icon className="size-5" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{rec.title}</span>
                        <ScoreBadge score={rec.score} />
                      </div>
                      <span className="text-muted-foreground text-xs">
                        {label}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => void handleDismiss(rec.id)}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
                <p className="text-muted-foreground text-sm">
                  {rec.description}
                </p>
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void handleAct(rec.id)}
                  >
                    <CheckCircle className="mr-1 size-4" />
                    Compris
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
