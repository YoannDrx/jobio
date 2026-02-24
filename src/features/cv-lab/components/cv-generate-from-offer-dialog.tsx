"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { generateCvFromOfferAction } from "../cv-generate-from-offer.action";

type CvGenerateFromOfferDialogProps = {
  onGenerated: (result: {
    targetRole: string;
    headlineOverride: string;
    summaryOverride: string;
    hiddenItems: Record<string, string[]>;
    contentOverrides: Record<
      string,
      { masterItemId: string; description?: string; title?: string }[]
    >;
  }) => void;
};

export function CvGenerateFromOfferDialog({
  onGenerated,
}: CvGenerateFromOfferDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [jobDescription, setJobDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [step, setStep] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (jobDescription.trim().length < 20) {
      toast.error("L'offre d'emploi doit contenir au moins 20 caracteres.");
      return;
    }

    setIsGenerating(true);
    setStep("Analyse de l'offre...");

    try {
      setStep("Generation du CV optimise...");
      const result = await resolveActionResult(
        generateCvFromOfferAction({ jobDescription }),
      );

      onGenerated(result);
      setIsOpen(false);
      setJobDescription("");
      toast.success("CV genere avec succes !");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de la generation",
      );
    } finally {
      setIsGenerating(false);
      setStep(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Sparkles className="mr-2 size-4" />
          Generer depuis une offre
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Generer un CV depuis une offre</DialogTitle>
          <DialogDescription>
            Collez l&apos;offre d&apos;emploi et l&apos;IA generera
            automatiquement un CV optimise a partir de votre CV Master.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>Offre d&apos;emploi</Label>
            <Textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              rows={10}
              placeholder="Collez l'offre d'emploi ici..."
              disabled={isGenerating}
            />
          </div>
          {step ? (
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <Loader2 className="size-4 animate-spin" />
              {step}
            </div>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => setIsOpen(false)}
              disabled={isGenerating}
            >
              Annuler
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || jobDescription.trim().length < 20}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Generation...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 size-4" />
                  Generer le CV
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
