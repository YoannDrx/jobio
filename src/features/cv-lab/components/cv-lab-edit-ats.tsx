"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { BarChart3 } from "lucide-react";

export type AtsAnalysis = {
  generatedAt: string;
  overallScore: number;
  scoreBreakdown: {
    completeness: number;
    keywordMatch: number;
    impact: number;
    readability: number;
  };
  keywordMetrics: {
    targetKeywords: string[];
    matchedKeywords: string[];
    missingKeywords: string[];
    coverage: number;
  };
  details: {
    presentSections: string[];
    missingSections: string[];
    hiddenSections: string[];
    quantifiableStatements: number;
  };
  strengths: string[];
  gaps: string[];
  recommendations: string[];
};

export type DraftDiffItem = {
  id: string;
  label: string;
  before: string;
  after: string;
};

export type AtsSuggestionPreview = {
  changeNotes: string[];
  diffItems: DraftDiffItem[];
};

export type CvLabEditAtsProps = {
  atsJobDescription: string;
  onAtsJobDescriptionChange: (value: string) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  hasDraft: boolean;
  atsAnalysis: AtsAnalysis | null;
  atsSuggestionPreview: AtsSuggestionPreview | null;
  atsSuggestionDiffItems: DraftDiffItem[];
  onPreviewSuggestions: () => void;
  onApplySuggestions: () => void;
  onCancelPreview: () => void;
};

const toDate = (value: string | Date) => new Date(value);

const getScoreTone = (score: number) => {
  if (score >= 80) return "text-emerald-600";
  if (score >= 60) return "text-amber-600";
  return "text-rose-600";
};

export function CvLabEditAts({
  atsJobDescription,
  onAtsJobDescriptionChange,
  onAnalyze,
  isAnalyzing,
  hasDraft,
  atsAnalysis,
  atsSuggestionPreview,
  atsSuggestionDiffItems,
  onPreviewSuggestions,
  onApplySuggestions,
  onCancelPreview,
}: CvLabEditAtsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">ATS Check</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="ats-job-description">
            Fiche de poste (optionnel, recommande)
          </Label>
          <Textarea
            id="ats-job-description"
            rows={5}
            placeholder="Colle ici l'offre cible pour evaluer le matching ATS..."
            value={atsJobDescription}
            onChange={(event) => onAtsJobDescriptionChange(event.target.value)}
          />
        </div>

        <Button
          variant="outline"
          onClick={onAnalyze}
          disabled={isAnalyzing || !hasDraft}
        >
          <BarChart3 className="mr-2 size-4" />
          {isAnalyzing ? "Analyse..." : "Lancer l'analyse ATS"}
        </Button>

        {atsAnalysis ? (
          <div className="flex flex-col gap-4 rounded-md border p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-muted-foreground text-xs uppercase">
                  Score global ATS
                </p>
                <p
                  className={cn(
                    "text-2xl font-semibold",
                    getScoreTone(atsAnalysis.overallScore),
                  )}
                >
                  {atsAnalysis.overallScore}/100
                </p>
              </div>
              <p className="text-muted-foreground text-xs">
                {toDate(atsAnalysis.generatedAt).toLocaleString("fr-FR")}
              </p>
            </div>
            <Progress
              value={atsAnalysis.overallScore}
              className="h-2"
              aria-label="Score ATS"
            />

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-md border p-3">
                <p className="text-xs font-medium uppercase">Completeness</p>
                <p className="mt-1 text-sm">
                  {atsAnalysis.scoreBreakdown.completeness}/100
                </p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs font-medium uppercase">Keyword Match</p>
                <p className="mt-1 text-sm">
                  {atsAnalysis.scoreBreakdown.keywordMatch}/100
                </p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs font-medium uppercase">Impact</p>
                <p className="mt-1 text-sm">
                  {atsAnalysis.scoreBreakdown.impact}/100
                </p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs font-medium uppercase">Readability</p>
                <p className="mt-1 text-sm">
                  {atsAnalysis.scoreBreakdown.readability}/100
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium uppercase">
                Couverture mots-cles
              </p>
              <p className="text-muted-foreground text-sm">
                {atsAnalysis.keywordMetrics.matchedKeywords.length} /{" "}
                {atsAnalysis.keywordMetrics.targetKeywords.length || 0} matches
                ({atsAnalysis.keywordMetrics.coverage}%)
              </p>
              {atsAnalysis.keywordMetrics.missingKeywords.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {atsAnalysis.keywordMetrics.missingKeywords
                    .slice(0, 12)
                    .map((keyword) => (
                      <Badge key={keyword} variant="outline">
                        {keyword}
                      </Badge>
                    ))}
                </div>
              ) : (
                <p className="text-sm text-emerald-600">
                  Aucun mot-cle critique manquant.
                </p>
              )}
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="flex flex-col gap-2 rounded-md border p-3">
                <p className="text-xs font-medium uppercase">Points forts</p>
                {atsAnalysis.strengths.length > 0 ? (
                  <ul className="list-disc space-y-1 pl-4 text-sm">
                    {atsAnalysis.strengths.map((strength) => (
                      <li key={strength}>{strength}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    Aucun point fort detecte pour le moment.
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2 rounded-md border p-3">
                <p className="text-xs font-medium uppercase">Gaps</p>
                {atsAnalysis.gaps.length > 0 ? (
                  <ul className="list-disc space-y-1 pl-4 text-sm">
                    {atsAnalysis.gaps.map((gap) => (
                      <li key={gap}>{gap}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    Aucun gap critique detecte.
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2 rounded-md border p-3">
              <p className="text-xs font-medium uppercase">
                Actions recommandees
              </p>
              {atsAnalysis.recommendations.length > 0 ? (
                <ul className="list-disc space-y-1 pl-4 text-sm">
                  {atsAnalysis.recommendations.map((recommendation) => (
                    <li key={recommendation}>{recommendation}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground text-sm">
                  Pas d'action supplementaire immediate.
                </p>
              )}
            </div>

            <p className="text-muted-foreground text-xs">
              Elements chiffres detectes:{" "}
              {atsAnalysis.details.quantifiableStatements}
            </p>

            <Separator />

            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onPreviewSuggestions}
                  data-testid="cv-lab-ats-preview-button"
                >
                  Prévisualiser suggestions ATS
                </Button>
                <p className="text-muted-foreground text-xs">
                  Génère une proposition de modifications avant application.
                </p>
              </div>

              {atsSuggestionPreview ? (
                <div
                  className="flex flex-col gap-3 rounded-md border p-3"
                  data-testid="cv-lab-ats-suggestion-preview"
                >
                  <p className="text-sm font-medium">
                    Aperçu des modifications proposées
                  </p>
                  {atsSuggestionPreview.changeNotes.length > 0 ? (
                    <ul className="list-disc space-y-1 pl-4 text-sm">
                      {atsSuggestionPreview.changeNotes.map((note) => (
                        <li key={note}>{note}</li>
                      ))}
                    </ul>
                  ) : null}

                  {atsSuggestionDiffItems.length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                      Aucune différence détectée.
                    </p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {atsSuggestionDiffItems.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-md border p-2"
                          data-testid={`cv-lab-ats-diff-${item.id}`}
                        >
                          <p className="text-xs font-medium">{item.label}</p>
                          <div className="mt-1 grid gap-2 md:grid-cols-2">
                            <div className="rounded-md border bg-amber-50 p-2">
                              <p className="text-[11px] font-medium text-amber-800 uppercase">
                                Avant
                              </p>
                              <p className="mt-1 text-xs text-amber-900">
                                {item.before}
                              </p>
                            </div>
                            <div className="rounded-md border bg-emerald-50 p-2">
                              <p className="text-[11px] font-medium text-emerald-800 uppercase">
                                Après
                              </p>
                              <p className="mt-1 text-xs text-emerald-900">
                                {item.after}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      onClick={onApplySuggestions}
                      data-testid="cv-lab-ats-apply-button"
                    >
                      Appliquer au brouillon
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={onCancelPreview}
                    >
                      Annuler l'aperçu
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">
            Lance une analyse pour obtenir un score ATS, les mots-cles manquants
            et les recommandations de rework.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
