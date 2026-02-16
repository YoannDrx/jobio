"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Search, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { analyzeCvCoachAtsKeywordsAction } from "../cv-coach-ats-keywords.action";

type CvCoachAtsKeywordPlannerProps = {
  sessionId: string;
};

type AnalysisResult = {
  matched: { keyword: string; context: string }[];
  missing: { keyword: string; suggestion: string }[];
  score: number;
};

export function CvCoachAtsKeywordPlanner({
  sessionId,
}: CvCoachAtsKeywordPlannerProps) {
  const [jobDescription, setJobDescription] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleAnalyze = async () => {
    if (jobDescription.trim().length < 20) {
      toast.error(
        "Veuillez entrer une fiche de poste d'au moins 20 caractères",
      );
      return;
    }

    setIsAnalyzing(true);
    try {
      const analysisResult = await resolveActionResult(
        analyzeCvCoachAtsKeywordsAction({
          sessionId,
          jobDescription,
        }),
      );
      setResult(analysisResult as AnalysisResult);
      toast.success("Analyse terminée");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de l'analyse",
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-emerald-600";
    if (score >= 40) return "text-amber-600";
    return "text-red-600";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 70) return "bg-emerald-50 dark:bg-emerald-950";
    if (score >= 40) return "bg-amber-50 dark:bg-amber-950";
    return "bg-red-50 dark:bg-red-950";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Analyseur de mots-clés ATS</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Textarea
          placeholder="Colle la fiche de poste ici..."
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          className="min-h-[120px]"
          disabled={isAnalyzing}
        />

        <Button
          onClick={handleAnalyze}
          disabled={isAnalyzing || jobDescription.trim().length < 20}
          className="w-full"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Analyse en cours...
            </>
          ) : (
            <>
              <Search className="mr-2 size-4" />
              Analyser les mots-clés
            </>
          )}
        </Button>

        {result && (
          <div className="flex flex-col gap-4">
            {/* Score */}
            <div
              className={`flex flex-col items-center justify-center rounded-lg ${getScoreBgColor(result.score)} p-6`}
            >
              <p className="text-muted-foreground mb-2 text-sm font-medium">
                Score de correspondance
              </p>
              <p
                className={`text-5xl font-bold ${getScoreColor(result.score)}`}
              >
                {result.score}
              </p>
              <p className="text-muted-foreground mt-2 text-xs">
                {result.score >= 70
                  ? "Très bon match"
                  : result.score >= 40
                    ? "Match acceptable"
                    : "Match insuffisant"}
              </p>
            </div>

            {/* Matched Keywords */}
            {result.matched.length > 0 && (
              <div className="flex flex-col gap-2">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <CheckCircle2 className="size-4 text-emerald-600" />
                  Mots-clés trouvés ({result.matched.length})
                </h3>
                <div className="flex flex-col gap-2">
                  {result.matched.map((item, idx) => (
                    <div key={idx} className="flex flex-col gap-1">
                      <Badge variant="outline" className="w-fit">
                        <CheckCircle2 className="mr-1 size-3 text-emerald-600" />
                        {item.keyword}
                      </Badge>
                      <p className="text-muted-foreground text-xs">
                        {item.context}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Missing Keywords */}
            {result.missing.length > 0 && (
              <div className="flex flex-col gap-2">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <XCircle className="size-4 text-red-600" />
                  Mots-clés manquants ({result.missing.length})
                </h3>
                <div className="flex flex-col gap-2">
                  {result.missing.map((item, idx) => (
                    <div key={idx} className="flex flex-col gap-1">
                      <Badge
                        variant="outline"
                        className="w-fit border-red-200 text-red-600"
                      >
                        <XCircle className="mr-1 size-3" />
                        {item.keyword}
                      </Badge>
                      <p className="text-muted-foreground text-xs">
                        {item.suggestion}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
