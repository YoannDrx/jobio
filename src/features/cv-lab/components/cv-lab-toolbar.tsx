"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Copy,
  Download,
  Eye,
  FileDown,
  PencilLine,
  RotateCcw,
  Save,
  Trash2,
  Upload,
} from "lucide-react";
import type { ChangeEvent, RefObject } from "react";
import { toast } from "sonner";

type CvLabToolbarProps = {
  hasUnsavedChanges: boolean;
  isEditPanelOpen: boolean;
  onToggleEditPanel: () => void;
  onSave: () => void;
  isSaving: boolean;
  onReset: () => void;
  onDuplicate: () => void;
  isDuplicating: boolean;
  onExportJson: () => void;
  isExportingJson: boolean;
  onImportJson: () => void;
  isImportingJson: boolean;
  importInputRef: RefObject<HTMLInputElement | null>;
  onImportInputChange: (event: ChangeEvent<HTMLInputElement>) => void;
  previewHtml: string | null;
  onExportPdf: () => void;
  isExportingPdf: boolean;
  isArchived: boolean;
  onArchive: () => void;
  isArchiving: boolean;
  onRestore: () => void;
  isRestoring: boolean;
  onDelete: () => void;
  isDeleting: boolean;
  recoverableLocalDraft?: {
    savedAt: string;
  } | null;
  onRestoreLocalDraft?: () => void;
  onDiscardLocalDraft?: () => void;
};

const toDate = (value: string | Date) => new Date(value);

export function CvLabToolbar({
  hasUnsavedChanges,
  isEditPanelOpen,
  onToggleEditPanel,
  onSave,
  isSaving,
  onReset,
  onDuplicate,
  isDuplicating,
  onExportJson,
  isExportingJson,
  onImportJson,
  isImportingJson,
  importInputRef,
  onImportInputChange,
  previewHtml,
  onExportPdf,
  isExportingPdf,
  isArchived,
  onArchive,
  isArchiving,
  onRestore,
  isRestoring,
  onDelete,
  isDeleting,
  recoverableLocalDraft,
  onRestoreLocalDraft,
  onDiscardLocalDraft,
}: CvLabToolbarProps) {
  return (
    <div className="flex flex-col gap-3">
      {recoverableLocalDraft ? (
        <Card data-testid="cv-lab-local-recovery-card">
          <CardHeader>
            <CardTitle className="text-base">Brouillon local détecté</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <p className="text-muted-foreground text-sm">
              Un brouillon non sauvegardé a été retrouvé (
              {toDate(recoverableLocalDraft.savedAt).toLocaleString("fr-FR")}).
            </p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={onRestoreLocalDraft}>
                Restaurer le brouillon local
              </Button>
              <Button size="sm" variant="outline" onClick={onDiscardLocalDraft}>
                Ignorer le brouillon local
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={importInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={onImportInputChange}
        />
        <Button
          variant={isEditPanelOpen ? "secondary" : "outline"}
          onClick={onToggleEditPanel}
        >
          <PencilLine className="mr-2 size-4" />
          {isEditPanelOpen ? "Fermer l'éditeur" : "Éditer"}
        </Button>
        <Button onClick={onSave} disabled={isSaving || !hasUnsavedChanges}>
          <Save className="mr-2 size-4" />
          Enregistrer
        </Button>
        <Button variant="ghost" onClick={onReset} disabled={!hasUnsavedChanges}>
          <RotateCcw className="mr-2 size-4" />
          Réinitialiser
        </Button>
        <Button
          variant="outline"
          onClick={onDuplicate}
          disabled={isDuplicating}
        >
          <Copy className="mr-2 size-4" />
          Dupliquer
        </Button>
        <Button
          variant="outline"
          onClick={onExportJson}
          disabled={isExportingJson}
        >
          <Download className="mr-2 size-4" />
          Export JSON
        </Button>
        <Button
          variant="outline"
          onClick={onImportJson}
          disabled={isImportingJson}
        >
          <Upload className="mr-2 size-4" />
          Import JSON
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            if (!previewHtml) {
              toast.error("Prévisualisation non disponible");
              return;
            }
            const previewBlob = new Blob([previewHtml], {
              type: "text/html;charset=utf-8",
            });
            const previewBlobUrl = window.URL.createObjectURL(previewBlob);
            window.open(previewBlobUrl, "_blank", "noopener,noreferrer");
            window.setTimeout(() => {
              window.URL.revokeObjectURL(previewBlobUrl);
            }, 60_000);
          }}
        >
          <Eye className="mr-2 size-4" />
          Ouvrir preview
        </Button>
        <Button
          variant="outline"
          onClick={onExportPdf}
          disabled={isExportingPdf}
        >
          <FileDown className="mr-2 size-4" />
          {isExportingPdf ? "Export..." : "Export PDF"}
        </Button>
        {isArchived ? (
          <Button variant="outline" onClick={onRestore} disabled={isRestoring}>
            <RotateCcw className="mr-2 size-4" />
            Restaurer
          </Button>
        ) : (
          <Button
            variant="destructive"
            onClick={onArchive}
            disabled={isArchiving}
          >
            <Trash2 className="mr-2 size-4" />
            Archiver
          </Button>
        )}
        <Button variant="destructive" onClick={onDelete} disabled={isDeleting}>
          <Trash2 className="mr-2 size-4" />
          Supprimer définitivement
        </Button>
      </div>
    </div>
  );
}
