"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Loader2, Sparkles, Check, X } from "lucide-react";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { rewriteCvFieldAction } from "../cv-rewrite.action";

type AiRewritePopoverProps = {
  text: string;
  onAccept: (newText: string) => void;
  context?: {
    jobTitle?: string;
    company?: string;
    targetRole?: string;
  };
};

type RewriteMode = "improve" | "shorten" | "adapt" | "correct";

const MODE_LABELS: Record<RewriteMode, string> = {
  improve: "Ameliorer",
  shorten: "Raccourcir",
  adapt: "Adapter au poste",
  correct: "Corriger",
};

export function AiRewritePopover({
  text,
  onAccept,
  context,
}: AiRewritePopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRewrite = async (mode: RewriteMode) => {
    if (!text.trim()) return;
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await resolveActionResult(
        rewriteCvFieldAction({ text, mode, context }),
      );
      setResult(response.rewritten);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur lors de la reecriture",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = () => {
    if (result) {
      onAccept(result);
      setResult(null);
      setIsOpen(false);
    }
  };

  const handleCancel = () => {
    setResult(null);
    setError(null);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          title="Reecriture IA"
          aria-label="Réécriture IA"
          disabled={!text.trim()}
        >
          <Sparkles className="size-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium">Reecriture IA</p>

          {!result && !isLoading ? (
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(MODE_LABELS) as RewriteMode[]).map((mode) => (
                <Button
                  key={mode}
                  variant="outline"
                  size="sm"
                  onClick={async () => handleRewrite(mode)}
                  disabled={isLoading}
                >
                  {MODE_LABELS[mode]}
                </Button>
              ))}
            </div>
          ) : null}

          {isLoading ? (
            <div className="flex items-center gap-2 py-2" aria-busy="true">
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              <span
                className="text-muted-foreground text-sm"
                aria-live="polite"
              >
                Reecriture en cours...
              </span>
            </div>
          ) : null}

          {error ? <p className="text-destructive text-sm">{error}</p> : null}

          {result ? (
            <div className="flex flex-col gap-2">
              <div className="bg-muted/50 max-h-48 overflow-y-auto rounded-md p-2 text-sm">
                {result}
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={handleCancel}>
                  <X className="mr-1 size-3.5" />
                  Annuler
                </Button>
                <Button size="sm" onClick={handleAccept}>
                  <Check className="mr-1 size-3.5" />
                  Appliquer
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}
