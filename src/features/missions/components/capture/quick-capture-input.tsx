"use client";

import { Input } from "@/components/ui/input";
import { LoadingButton } from "@/features/form/submit-button";
import { Loader2, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

type QuickCaptureInputProps = {
  onParse: (source: "url" | "text", content: string) => void;
  isLoading?: boolean;
};

const PARSING_STEPS = [
  { label: "Lecture de la page...", progress: 20, delay: 0 },
  { label: "Extraction des données...", progress: 50, delay: 1200 },
  { label: "Analyse IA en cours...", progress: 75, delay: 2500 },
  { label: "Création de la mission...", progress: 90, delay: 4000 },
];

export function QuickCaptureInput({
  onParse,
  isLoading,
}: QuickCaptureInputProps) {
  const [value, setValue] = useState("");
  const [currentStep, setCurrentStep] = useState("Traitement...");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isLoading) {
      setProgress(0);
      setCurrentStep("Traitement...");
      return;
    }

    const timeouts: NodeJS.Timeout[] = [];
    PARSING_STEPS.forEach(({ label, progress: stepProgress, delay }) => {
      const t = setTimeout(() => {
        setCurrentStep(label);
        setProgress(stepProgress);
      }, delay);
      timeouts.push(t);
    });

    return () => timeouts.forEach(clearTimeout);
  }, [isLoading]);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed) return;

    const isUrl = /^https?:\/\/.+/.test(trimmed);
    onParse(isUrl ? "url" : "text", trimmed);
  };

  return (
    <div className="flex gap-2">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Colle une URL ou du texte d'annonce..."
        className="flex-1"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            handleSubmit();
          }
        }}
      />
      {isLoading ? (
        <div className="flex w-full flex-col gap-2">
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <Loader2 className="size-4 animate-spin" />
            <span>{currentStep}</span>
          </div>
          <div className="bg-muted h-1.5 overflow-hidden rounded-full">
            <div
              className="bg-primary h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : (
        <LoadingButton
          loading={isLoading}
          onClick={handleSubmit}
          disabled={!value.trim()}
        >
          <Sparkles className="size-4" />
          Parser
        </LoadingButton>
      )}
    </div>
  );
}
