"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ChevronDown, Plus } from "lucide-react";
import { useState } from "react";
import { dialogManager } from "@/features/dialog-manager/dialog-manager";

type CvDocumentListItem = {
  id: string;
  name: string;
  targetRole: string | null;
  archivedAt: string | Date | null;
  _count: { versions: number };
};

type CvLabMinimalToolbarProps = {
  documentName: string;
  hasUnsavedChanges: boolean;
  documents: CvDocumentListItem[];
  selectedDocumentId: string | null;
  onSelectDocument: (id: string) => void;
  onCreate: () => void;
  isCreating: boolean;
};

export function CvLabMinimalToolbar({
  documentName,
  hasUnsavedChanges,
  documents,
  selectedDocumentId,
  onSelectDocument,
  onCreate,
  isCreating,
}: CvLabMinimalToolbarProps) {
  const [isDocPickerOpen, setIsDocPickerOpen] = useState(false);

  const handleSelectDocument = (id: string) => {
    if (id === selectedDocumentId) {
      setIsDocPickerOpen(false);
      return;
    }

    if (hasUnsavedChanges) {
      setIsDocPickerOpen(false);
      dialogManager.confirm({
        title: "Modifications non sauvegardées",
        description:
          "Tu as des modifications non sauvegardées. Changer de CV va les perdre. Continuer ?",
        action: {
          label: "Continuer",
          onClick: async () => {
            onSelectDocument(id);
          },
        },
        cancel: { label: "Annuler" },
      });
      return;
    }

    onSelectDocument(id);
    setIsDocPickerOpen(false);
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Popover open={isDocPickerOpen} onOpenChange={setIsDocPickerOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="hover:bg-muted flex items-center gap-1.5 rounded-md px-2 py-1 transition-colors"
            >
              <p className="text-lg font-semibold">{documentName}</p>
              <ChevronDown className="text-muted-foreground size-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-72 p-2">
            <div className="flex max-h-64 flex-col gap-1 overflow-y-auto">
              {documents.map((doc) => (
                <button
                  key={doc.id}
                  type="button"
                  className={cn(
                    "w-full rounded-md px-3 py-2 text-left transition-colors",
                    doc.id === selectedDocumentId
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted",
                  )}
                  onClick={() => handleSelectDocument(doc.id)}
                >
                  <p className="truncate text-sm font-medium">{doc.name}</p>
                  <p className="text-muted-foreground truncate text-xs">
                    {doc.targetRole ?? "Poste non défini"}
                  </p>
                </button>
              ))}
              {documents.length === 0 ? (
                <p className="text-muted-foreground px-3 py-2 text-xs">
                  Aucun CV.
                </p>
              ) : null}
            </div>
            <div className="mt-1 border-t pt-1">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => {
                  setIsDocPickerOpen(false);
                  onCreate();
                }}
                disabled={isCreating}
              >
                <Plus className="mr-1.5 size-3.5" />
                Nouveau CV
              </Button>
            </div>
          </PopoverContent>
        </Popover>
        {hasUnsavedChanges ? (
          <Badge variant="outline" className="text-xs">
            Non sauvegardé
          </Badge>
        ) : null}
      </div>
    </div>
  );
}
