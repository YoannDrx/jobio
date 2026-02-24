"use client";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Sparkles, Copy, ExternalLink } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { generateNegotiationScriptAction } from "@/features/ai/generate-negotiation-script.action";

type MissionTjmNegotiationProps = {
  missionId: string;
  tjm: number | null;
  missionTitle: string;
  company: string | null;
};

export function MissionTjmNegotiation({
  missionId,
  tjm,
  missionTitle,
  company,
}: MissionTjmNegotiationProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showScript, setShowScript] = useState(false);
  const [script, setScript] = useState<{
    script: string;
    tjm: number;
    avgTjm: number | null;
  } | null>(null);

  const handleGenerateScript = async () => {
    try {
      setIsLoading(true);
      const result = await resolveActionResult(
        generateNegotiationScriptAction({ missionId }),
      );
      setScript(result);
      setShowScript(true);
      toast.success("Script de négociation généré");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de la génération",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyScript = async () => {
    if (!script) return;
    try {
      await navigator.clipboard.writeText(script.script);
      toast.success("Script copié");
    } catch {
      toast.error("Erreur lors de la copie");
    }
  };

  if (tjm === null) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-muted-foreground text-sm">
          Ajouter un TJM pour débloquer l'assistant de négociation
        </p>
        <a
          href="#"
          className="text-primary flex items-center gap-1 text-sm hover:underline"
        >
          <ExternalLink className="size-3" />
          Configurer le TJM
        </a>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <h4 className="text-sm font-medium">Négociation TJM</h4>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">{tjm}€</span>
            <span className="text-muted-foreground text-sm">/jour</span>
          </div>
        </div>

        <Button
          onClick={handleGenerateScript}
          disabled={isLoading}
          className="w-full"
        >
          <Sparkles className="size-4" />
          {isLoading
            ? "Génération en cours..."
            : "Générer script de négociation IA"}
        </Button>
      </div>

      <Sheet open={showScript} onOpenChange={setShowScript}>
        <SheetContent
          side="right"
          className="w-full overflow-y-auto sm:max-w-lg"
        >
          <SheetHeader>
            <SheetTitle>Script de négociation</SheetTitle>
          </SheetHeader>

          {script && (
            <div className="flex flex-col gap-4 p-4">
              <div className="flex flex-col gap-2">
                <p className="text-muted-foreground text-sm">
                  <strong>{missionTitle}</strong>
                  {company && <> chez {company}</>}
                </p>
                <p className="text-muted-foreground text-sm">
                  TJM actuel : <strong>{script.tjm}€/j</strong>
                  {script.avgTjm && <> (moyenne : {script.avgTjm}€/j)</>}
                </p>
              </div>

              <div className="bg-muted flex flex-col gap-3 rounded-lg p-4">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {script.script}
                </p>
              </div>

              <Button
                onClick={handleCopyScript}
                variant="outline"
                className="w-full"
              >
                <Copy className="size-4" />
                Copier le script
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
