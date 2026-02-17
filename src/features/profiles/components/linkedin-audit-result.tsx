"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import type { LinkedinAuditOutput } from "@/features/ai/prompts/linkedin-audit.prompt";
import { linkedinAuditAction } from "@/features/ai/linkedin-audit.action";
import { Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type LinkedinAuditResultProps = {
  profileId?: string;
  initialData?: LinkedinAuditOutput | null;
};

function ScoreCircle({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const color =
    score >= 80
      ? "text-green-500"
      : score >= 60
        ? "text-cyan-500"
        : score >= 40
          ? "text-orange-500"
          : "text-red-500";

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg className="size-28 -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          className="text-muted/30"
        />
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={color}
        />
      </svg>
      <span className="absolute text-2xl font-bold">{score}</span>
    </div>
  );
}

export function LinkedinAuditResult({
  profileId,
  initialData,
}: LinkedinAuditResultProps) {
  const [data, setData] = useState<LinkedinAuditOutput | null>(
    initialData ?? null,
  );
  const [loading, setLoading] = useState(false);

  const runAudit = async () => {
    setLoading(true);
    try {
      const result = await resolveActionResult(
        linkedinAuditAction({ profileId }),
      );
      setData(result);
      toast.success("Audit LinkedIn termine !");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de l'audit",
      );
    } finally {
      setLoading(false);
    }
  };

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Audit LinkedIn Premium</CardTitle>
          <CardDescription>
            Analyse complete de ton profil LinkedIn avec un plan d'action sur 30
            jours
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={runAudit} disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
            {loading ? "Analyse en cours..." : "Lancer un audit"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Audit LinkedIn Premium</CardTitle>
              <CardDescription>Score global de ton profil</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={runAudit}
              disabled={loading}
            >
              {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
              Relancer
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <ScoreCircle score={data.overallScore} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Scores par section</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {data.sections.map((section) => (
            <div key={section.name} className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-sm">
                <span>{section.name}</span>
                <span className="text-muted-foreground font-mono">
                  {section.score}/100
                </span>
              </div>
              <Progress value={section.score} />
              <p className="text-muted-foreground text-xs">
                {section.feedback}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Points forts</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-1.5">
            {data.strengths.map((s) => (
              <Badge
                key={s}
                className="border-none bg-green-500/10 text-xs text-green-600 dark:text-green-400"
              >
                {s}
              </Badge>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Lacunes</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-1.5">
            {data.gaps.map((g) => (
              <Badge
                key={g}
                className="border-none bg-red-500/10 text-xs text-red-600 dark:text-red-400"
              >
                {g}
              </Badge>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Wins</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-1.5">
            {data.quickWins.map((q) => (
              <Badge
                key={q}
                className="border-none bg-orange-500/10 text-xs text-orange-600 dark:text-orange-400"
              >
                {q}
              </Badge>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Plan d'action 30 jours</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {(
            [
              { label: "Semaine 1", items: data.actionPlan.week1 },
              { label: "Semaine 2", items: data.actionPlan.week2 },
              { label: "Semaine 3", items: data.actionPlan.week3 },
              { label: "Semaine 4", items: data.actionPlan.week4 },
            ] as const
          ).map((week) => (
            <div key={week.label} className="flex flex-col gap-1">
              <p className="text-sm font-medium">{week.label}</p>
              <ul className="text-muted-foreground list-inside list-disc text-sm">
                {week.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
