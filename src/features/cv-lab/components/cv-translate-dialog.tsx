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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Globe, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { translateCvAction } from "../cv-translate.action";

type CvTranslateDialogProps = {
  onTranslated: (result: {
    translatedHeadline: string;
    translatedSummary: string;
    translatedName: string;
    contentOverrides: Record<
      string,
      {
        masterItemId: string;
        description?: string;
        title?: string;
      }[]
    >;
    documentName: string;
  }) => void;
};

const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "de", label: "Deutsch" },
  { value: "es", label: "Español" },
  { value: "it", label: "Italiano" },
  { value: "pt", label: "Português" },
  { value: "nl", label: "Nederlands" },
] as const;

export function CvTranslateDialog({ onTranslated }: CvTranslateDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState<string>("");
  const [documentName, setDocumentName] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);

  const handleTranslate = async () => {
    if (!targetLanguage) {
      toast.error("Veuillez sélectionner une langue cible.");
      return;
    }

    setIsTranslating(true);

    try {
      const result = await resolveActionResult(
        translateCvAction({
          targetLanguage: targetLanguage as
            | "en"
            | "de"
            | "es"
            | "it"
            | "pt"
            | "nl",
          documentName: documentName || undefined,
        }),
      );

      onTranslated(result);
      setIsOpen(false);
      setTargetLanguage("");
      setDocumentName("");
      toast.success("CV traduit avec succès !");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de la traduction",
      );
    } finally {
      setIsTranslating(false);
    }
  };

  const selectedLanguage = LANGUAGE_OPTIONS.find(
    (lang) => lang.value === targetLanguage,
  );
  const defaultDocumentName = selectedLanguage
    ? `CV - ${selectedLanguage.label}`
    : "";

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Globe className="mr-2 size-4" />
          Traduire
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Traduire le CV</DialogTitle>
          <DialogDescription>
            Traduisez votre CV Master dans une autre langue. L&apos;IA adaptera
            le contenu à la culture et la langue cible.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>Langue cible</Label>
            <Select value={targetLanguage} onValueChange={setTargetLanguage}>
              <SelectTrigger disabled={isTranslating}>
                <SelectValue placeholder="Sélectionnez une langue..." />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Nom du document (optionnel)</Label>
            <Input
              value={documentName}
              onChange={(e) => setDocumentName(e.target.value)}
              placeholder={defaultDocumentName || "CV - [Langue]"}
              disabled={isTranslating}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => setIsOpen(false)}
              disabled={isTranslating}
            >
              Annuler
            </Button>
            <Button
              onClick={handleTranslate}
              disabled={isTranslating || !targetLanguage}
            >
              {isTranslating ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Traduction en cours...
                </>
              ) : (
                <>
                  <Globe className="mr-2 size-4" />
                  Traduire
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
