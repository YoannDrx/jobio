"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LoadingButton } from "@/features/form/submit-button";
import type { CreateProfileInput } from "@/features/profiles/profiles.schema";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { useFileUpload, formatBytes } from "@/hooks/use-file-upload";
import { Archive, CheckCircle, FileUp, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { importLinkedInZipAction } from "../import-linkedin-zip.action";

type LinkedInZipImportProps = {
  onImport: (data: Partial<CreateProfileInput>) => void;
};

type PreviewData = Partial<CreateProfileInput> | null;

export function LinkedInZipImport({ onImport }: LinkedInZipImportProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState<PreviewData>(null);

  const [{ files, isDragging, errors }, actions] = useFileUpload({
    accept: ".zip,application/zip,application/x-zip-compressed",
    maxSize: 50 * 1024 * 1024,
  });

  const selectedFile = files.length > 0 ? files[0] : null;

  const handleExtract = async () => {
    if (!selectedFile || !(selectedFile.file instanceof File)) {
      toast.error("Veuillez selectionner un fichier ZIP");
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile.file);

      const result = await resolveActionResult(
        importLinkedInZipAction({ formData }),
      );
      setPreview(result);
      toast.success("Donnees extraites avec succes");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors de l'extraction du ZIP",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = () => {
    if (!preview) return;
    onImport(preview);
    setPreview(null);
    actions.clearFiles();
    toast.success("Profil importe depuis l'archive LinkedIn");
  };

  const handleReset = () => {
    setPreview(null);
    actions.clearFiles();
  };

  if (preview) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium">Apercu des donnees extraites</h4>
          <Button variant="ghost" size="sm" onClick={handleReset}>
            <X className="mr-1 size-4" />
            Annuler
          </Button>
        </div>

        <Card className="flex flex-col gap-2 p-4 text-sm">
          {preview.headline && (
            <div>
              <span className="text-muted-foreground">Titre :</span>{" "}
              {preview.headline}
            </div>
          )}
          {preview.bio && (
            <div>
              <span className="text-muted-foreground">Bio :</span>{" "}
              {preview.bio.slice(0, 100)}
              {preview.bio.length > 100 ? "..." : ""}
            </div>
          )}
          {preview.skills && preview.skills.length > 0 && (
            <div>
              <span className="text-muted-foreground">Competences :</span>{" "}
              {preview.skills.length} detectees
            </div>
          )}
          {preview.experiences && preview.experiences.length > 0 && (
            <div>
              <span className="text-muted-foreground">Experiences :</span>{" "}
              {preview.experiences.length} detectees
            </div>
          )}
          {preview.education && preview.education.length > 0 && (
            <div>
              <span className="text-muted-foreground">Formations :</span>{" "}
              {preview.education.length} detectees
            </div>
          )}
          {preview.certifications && preview.certifications.length > 0 && (
            <div>
              <span className="text-muted-foreground">Certifications :</span>{" "}
              {preview.certifications.length} detectees
            </div>
          )}
          {preview.languages && preview.languages.length > 0 && (
            <div>
              <span className="text-muted-foreground">Langues :</span>{" "}
              {preview.languages.length} detectees
            </div>
          )}
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleConfirm}>
            <CheckCircle className="mr-1 size-4" />
            Confirmer l&apos;import
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {!selectedFile ? (
        <div
          role="button"
          tabIndex={0}
          onDragEnter={actions.handleDragEnter}
          onDragLeave={actions.handleDragLeave}
          onDragOver={actions.handleDragOver}
          onDrop={actions.handleDrop}
          onClick={actions.openFileDialog}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") actions.openFileDialog();
          }}
          className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50"
          }`}
        >
          <Archive className="text-muted-foreground size-8" />
          <p className="text-sm font-medium">
            Glisse ton archive LinkedIn (ZIP) ici ou clique pour selectionner
          </p>
          <p className="text-muted-foreground text-xs">
            Archive RGPD LinkedIn, max 50 Mo
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-lg border p-3">
          <FileUp className="text-muted-foreground size-5 shrink-0" />
          <div className="flex-1 truncate">
            <p className="truncate text-sm font-medium">
              {selectedFile.file.name}
            </p>
            <p className="text-muted-foreground text-xs">
              {formatBytes(selectedFile.file.size)}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => actions.removeFile(selectedFile.id)}
            disabled={isLoading}
          >
            <X className="size-4" />
          </Button>
        </div>
      )}

      {errors.length > 0 && (
        <p className="text-destructive text-sm">{errors[0]}</p>
      )}

      <input {...actions.getInputProps()} className="hidden" />

      <div className="flex justify-end">
        <LoadingButton
          onClick={() => void handleExtract()}
          loading={isLoading}
          disabled={!selectedFile}
        >
          Extraire les donnees
        </LoadingButton>
      </div>
    </div>
  );
}
