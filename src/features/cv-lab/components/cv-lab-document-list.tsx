"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { dialogManager } from "@/features/dialog-manager/dialog-manager";
import { cn } from "@/lib/utils";

type DocumentViewFilter = "active" | "all" | "archived";

type CvDocumentListItem = {
  id: string;
  name: string;
  targetRole: string | null;
  coachSessionId: string | null;
  archivedAt: string | Date | null;
  updatedAt: string | Date;
  _count: { versions: number };
};

type CvLabDocumentListProps = {
  documents: CvDocumentListItem[];
  selectedDocumentId: string | null;
  documentView: DocumentViewFilter;
  onSelectDocument: (id: string) => void;
  onViewChange: (view: DocumentViewFilter) => void;
  hasUnsavedChanges: boolean;
};

const toDate = (value: string | Date) => new Date(value);

export function CvLabDocumentList({
  documents,
  selectedDocumentId,
  documentView,
  onSelectDocument,
  onViewChange,
  hasUnsavedChanges,
}: CvLabDocumentListProps) {
  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle>Mes CV</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <Label>Vue</Label>
          <Select
            value={documentView}
            onValueChange={(value) => {
              if (hasUnsavedChanges) {
                dialogManager.confirm({
                  title: "Modifications non sauvegardées",
                  description:
                    "Tu as des modifications non sauvegardées. Changer de vue va les perdre. Continuer ?",
                  action: {
                    label: "Continuer",
                    onClick: async () => {
                      onViewChange(value as DocumentViewFilter);
                    },
                  },
                  cancel: { label: "Annuler" },
                });
                return;
              }
              onViewChange(value as DocumentViewFilter);
            }}
          >
            <SelectTrigger
              className="w-full"
              data-testid="cv-lab-view-filter-trigger"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Actifs</SelectItem>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="archived">Archivés</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {documents.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Aucun CV dans cette vue.
          </p>
        ) : (
          documents.map((document) => (
            <button
              key={document.id}
              className={cn(
                "w-full rounded-md border p-3 text-left transition-colors",
                document.id === selectedDocumentId
                  ? "border-primary bg-primary/5"
                  : "hover:bg-muted/40",
              )}
              onClick={() => {
                if (document.id === selectedDocumentId) return;
                if (hasUnsavedChanges) {
                  dialogManager.confirm({
                    title: "Modifications non sauvegardées",
                    description:
                      "Tu as des modifications non sauvegardées. Changer de CV va les perdre. Continuer ?",
                    action: {
                      label: "Continuer",
                      onClick: async () => {
                        onSelectDocument(document.id);
                      },
                    },
                    cancel: { label: "Annuler" },
                  });
                  return;
                }
                onSelectDocument(document.id);
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-medium">{document.name}</p>
                <div className="flex items-center gap-2">
                  {document.coachSessionId ? (
                    <Badge
                      variant="outline"
                      className="border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-700 dark:bg-violet-950 dark:text-violet-300"
                    >
                      Coach IA
                    </Badge>
                  ) : null}
                  {document.archivedAt ? (
                    <Badge variant="secondary">Archivé</Badge>
                  ) : null}
                  <span className="text-muted-foreground text-xs">
                    {document._count.versions} v
                  </span>
                </div>
              </div>
              <p className="text-muted-foreground mt-1 truncate text-xs">
                {document.targetRole ?? "Poste non défini"}
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                {toDate(document.updatedAt).toLocaleDateString("fr-FR")}
              </p>
            </button>
          ))
        )}
      </CardContent>
    </Card>
  );
}
