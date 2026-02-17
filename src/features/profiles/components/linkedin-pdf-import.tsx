"use client";

import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/features/form/submit-button";
import type { CreateProfileInput } from "@/features/profiles/profiles.schema";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { useFileUpload, formatBytes } from "@/hooks/use-file-upload";
import { FileUp, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { importLinkedInPdfAction } from "../import-linkedin-pdf.action";

type LinkedInPdfImportProps = {
  onImport: (data: Partial<CreateProfileInput>) => void;
};

export function LinkedInPdfImport({ onImport }: LinkedInPdfImportProps) {
  const [isLoading, setIsLoading] = useState(false);

  const [{ files, isDragging, errors }, actions] = useFileUpload({
    accept: ".pdf,application/pdf",
    maxSize: 5 * 1024 * 1024,
  });

  const selectedFile = files.length > 0 ? files[0] : null;

  const handleImport = async () => {
    if (!selectedFile || !(selectedFile.file instanceof File)) {
      toast.error("Veuillez sélectionner un fichier PDF");
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile.file);

      const result = await resolveActionResult(
        importLinkedInPdfAction({ formData }),
      );
      onImport(result);
      actions.clearFiles();
      toast.success("Profil importé depuis le PDF");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors de l'import du PDF",
      );
    } finally {
      setIsLoading(false);
    }
  };

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
          <FileUp className="text-muted-foreground size-8" />
          <p className="text-sm font-medium">
            Glisse ton PDF LinkedIn ici ou clique pour sélectionner
          </p>
          <p className="text-muted-foreground text-xs">
            PDF uniquement, max 5 Mo
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
          onClick={() => void handleImport()}
          loading={isLoading}
          disabled={!selectedFile}
        >
          Importer avec l&apos;IA
        </LoadingButton>
      </div>
    </div>
  );
}
