"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import type { ScoringWeights } from "../mission-scoring";
import { DEFAULT_SCORING_WEIGHTS } from "../mission-scoring";
import { updateScoringWeightsAction } from "../scoring-weights.action";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { toast } from "sonner";

type ScoringWeightsEditorProps = {
  profileId: string;
  initialWeights?: Partial<ScoringWeights>;
};

export function ScoringWeightsEditor({
  profileId,
  initialWeights,
}: ScoringWeightsEditorProps) {
  const weights = {
    ...DEFAULT_SCORING_WEIGHTS,
    ...initialWeights,
  };

  const [values, setValues] = useState<ScoringWeights>(weights);
  const [loading, setLoading] = useState(false);

  const total = Object.values(values).reduce((sum, val) => sum + val, 0);
  const isValidTotal = total <= 100;

  const categories = [
    {
      key: "skills" as const,
      label: "Compétences",
    },
    {
      key: "tjm" as const,
      label: "TJM",
    },
    {
      key: "workType" as const,
      label: "Mode de travail",
    },
    {
      key: "location" as const,
      label: "Localisation",
    },
    {
      key: "completeness" as const,
      label: "Complétude",
    },
  ];

  const handleValueChange = (key: keyof ScoringWeights, value: number) => {
    setValues((prev) => ({
      ...prev,
      [key]: Math.max(0, Math.min(100, value)),
    }));
  };

  const handleSave = async () => {
    if (!isValidTotal) {
      toast.error(
        `La somme des poids ne peut pas dépasser 100 (actuellement ${total})`,
      );
      return;
    }

    setLoading(true);
    try {
      await resolveActionResult(
        updateScoringWeightsAction({
          profileId,
          weights: values,
        }),
      );
      toast.success("Poids de scoring mis à jour");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Une erreur est survenue";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setValues(DEFAULT_SCORING_WEIGHTS);
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold">Poids de scoring</h3>
          <p className="text-muted-foreground text-sm">
            Personnalisez l'importance de chaque critère dans le calcul du score
            de compatibilité
          </p>
        </div>

        <div className="space-y-4">
          {categories.map(({ key, label }) => (
            <div key={key} className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor={`weight-${key}`} className="text-sm">
                  {label}
                </Label>
                <span className="text-muted-foreground text-sm font-medium">
                  {values[key]}
                </span>
              </div>
              <input
                id={`weight-${key}`}
                type="range"
                min="0"
                max="100"
                step="1"
                value={values[key]}
                onChange={(e) =>
                  handleValueChange(key, parseInt(e.target.value, 10))
                }
                className="w-full"
              />
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Total</span>
            <span
              className={`text-sm font-semibold ${
                isValidTotal ? "text-green-600" : "text-red-600"
              }`}
            >
              {total}/100
            </span>
          </div>
          <Progress value={Math.min(total, 100)} className="h-2" />
          {!isValidTotal && (
            <p className="text-xs text-red-600">
              ⚠️ La somme des poids dépasse 100. Ajustez vos valeurs.
            </p>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            onClick={handleSave}
            disabled={loading || !isValidTotal}
            className="flex-1"
          >
            {loading ? "Enregistrement..." : "Enregistrer"}
          </Button>
          <Button onClick={handleReset} variant="outline" disabled={loading}>
            Réinitialiser
          </Button>
        </div>
      </div>
    </Card>
  );
}
