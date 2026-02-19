"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import {
  Archive,
  ChevronDown,
  Copy,
  Download,
  Eye,
  FileDown,
  RotateCcw,
  Trash2,
  Upload,
} from "lucide-react";
import type { ChangeEvent, ReactNode, RefObject } from "react";
import { toast } from "sonner";

type RecoverableLocalDraft = {
  savedAt: string;
};

type CvLabPanelContentProps = {
  editPanel: ReactNode;
  recoverableLocalDraft: RecoverableLocalDraft | null;
  onRestoreLocalDraft: () => void;
  onDiscardLocalDraft: () => void;
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
  onReset: () => void;
  hasUnsavedChanges: boolean;
};

const toDate = (value: string | Date) => new Date(value);

export function CvLabPanelContent({
  editPanel,
  recoverableLocalDraft,
  onRestoreLocalDraft,
  onDiscardLocalDraft,
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
  onReset,
  hasUnsavedChanges,
}: CvLabPanelContentProps) {
  return (
    <div className="flex flex-col gap-4">
      <input
        ref={importInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={onImportInputChange}
      />

      {recoverableLocalDraft ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Brouillon local détecté</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <p className="text-muted-foreground text-xs">
              Un brouillon non sauvegardé a été retrouvé (
              {toDate(recoverableLocalDraft.savedAt).toLocaleString("fr-FR")}).
            </p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={onRestoreLocalDraft}>
                Restaurer
              </Button>
              <Button size="sm" variant="outline" onClick={onDiscardLocalDraft}>
                Ignorer
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {editPanel}

      <Separator />

      <Collapsible defaultOpen>
        <CollapsibleTrigger className="flex w-full items-center justify-between py-1 text-sm font-medium">
          Actions
          <ChevronDown className="size-4 transition-transform [[data-state=open]>&]:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2 flex flex-col gap-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={onDuplicate}
            disabled={isDuplicating}
          >
            <Copy className="mr-2 size-3.5" />
            Dupliquer
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={onExportPdf}
            disabled={isExportingPdf}
          >
            <FileDown className="mr-2 size-3.5" />
            {isExportingPdf ? "Export..." : "Export PDF"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={onExportJson}
            disabled={isExportingJson}
          >
            <Download className="mr-2 size-3.5" />
            Export JSON
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={onImportJson}
            disabled={isImportingJson}
          >
            <Upload className="mr-2 size-3.5" />
            Import JSON
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
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
            <Eye className="mr-2 size-3.5" />
            Ouvrir preview
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={onReset}
            disabled={!hasUnsavedChanges}
          >
            <RotateCcw className="mr-2 size-3.5" />
            Réinitialiser
          </Button>
          <Separator />
          {isArchived ? (
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={onRestore}
              disabled={isRestoring}
            >
              <RotateCcw className="mr-2 size-3.5" />
              Restaurer
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="text-destructive w-full justify-start"
              onClick={onArchive}
              disabled={isArchiving}
            >
              <Archive className="mr-2 size-3.5" />
              Archiver
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="text-destructive w-full justify-start"
            onClick={onDelete}
            disabled={isDeleting}
          >
            <Trash2 className="mr-2 size-3.5" />
            Supprimer définitivement
          </Button>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
