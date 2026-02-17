"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { LoadingButton } from "@/features/form/submit-button";
import type { CreateProfileInput } from "@/features/profiles/profiles.schema";
import { resolveActionResult } from "@/lib/actions/actions-utils";

import { useState } from "react";
import { toast } from "sonner";
import { importLinkedInAction } from "../import-linkedin.action";

type LinkedInImportProps = {
  onImport: (data: Partial<CreateProfileInput>) => void;
};

export function LinkedInImport({ onImport }: LinkedInImportProps) {
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleImport = async () => {
    if (!content.trim()) {
      toast.error("Veuillez coller votre profil LinkedIn");
      return;
    }

    setIsLoading(true);
    try {
      const result = await resolveActionResult(
        importLinkedInAction({ content: content.trim() }),
      );
      onImport(result);
      setContent("");
      toast.success("Profil importé avec succès");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors de l'import du profil",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <Textarea
        placeholder="Colle ici le contenu de ton profil LinkedIn (texte brut)..."
        rows={6}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        disabled={isLoading}
      />
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => setContent("")}
          disabled={isLoading || !content.trim()}
        >
          Effacer
        </Button>
        <LoadingButton onClick={() => void handleImport()} loading={isLoading}>
          Importer avec l&apos;IA
        </LoadingButton>
      </div>
    </div>
  );
}
