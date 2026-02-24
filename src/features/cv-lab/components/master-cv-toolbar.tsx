"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  CheckCircle,
  CloudOff,
  Loader2,
  Upload,
  UserRound,
} from "lucide-react";

type SaveStatus = "idle" | "saving" | "saved" | "error";

type MasterCvToolbarProps = {
  isImporting: boolean;
  onImportFromProfile: () => Promise<void>;
  onImportFromFile: () => void;
  saveStatus: SaveStatus;
  completeness: { score: number; missing: string[] } | null;
};

function SaveStatusBadge({ status }: { status: SaveStatus }) {
  switch (status) {
    case "saving":
      return (
        <Badge variant="outline" className="gap-1 text-xs">
          <Loader2 className="size-3 animate-spin" />
          Sauvegarde...
        </Badge>
      );
    case "saved":
      return (
        <Badge variant="outline" className="gap-1 text-xs text-green-600">
          <CheckCircle className="size-3" />
          Sauvegarde
        </Badge>
      );
    case "error":
      return (
        <Badge variant="destructive" className="gap-1 text-xs">
          <CloudOff className="size-3" />
          Erreur
        </Badge>
      );
    default:
      return null;
  }
}

export function MasterCvToolbar({
  isImporting,
  onImportFromProfile,
  onImportFromFile,
  saveStatus,
  completeness,
}: MasterCvToolbarProps) {
  return (
    <div className="flex items-center justify-between gap-2 px-4 py-2">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold">Mon CV Master</h2>
        <SaveStatusBadge status={saveStatus} />
        {completeness ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2">
                  <div className="bg-muted h-2 w-20 overflow-hidden rounded-full">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${completeness.score}%`,
                        backgroundColor:
                          completeness.score >= 80
                            ? "#16a34a"
                            : completeness.score >= 50
                              ? "#ca8a04"
                              : "#dc2626",
                      }}
                    />
                  </div>
                  <span className="text-muted-foreground text-xs">
                    {completeness.score}%
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                {completeness.missing.length > 0 ? (
                  <div className="flex flex-col gap-1">
                    <p className="font-medium">Elements manquants :</p>
                    <ul className="list-inside list-disc text-xs">
                      {completeness.missing.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p>CV Master complet !</p>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onImportFromProfile}
          disabled={isImporting}
        >
          <UserRound className="mr-2 size-4" />
          {isImporting ? "Import..." : "Importer depuis le profil"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onImportFromFile}
          disabled={isImporting}
        >
          <Upload className="mr-2 size-4" />
          {isImporting ? "Import..." : "Importer un fichier"}
        </Button>
      </div>
    </div>
  );
}
