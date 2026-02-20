"use client";

import { Button } from "@/components/ui/button";
import { Upload, UserRound } from "lucide-react";

type MasterCvToolbarProps = {
  isImporting: boolean;
  onImportFromProfile: () => Promise<void>;
  onImportFromFile: () => void;
};

export function MasterCvToolbar({
  isImporting,
  onImportFromProfile,
  onImportFromFile,
}: MasterCvToolbarProps) {
  return (
    <div className="flex items-center justify-between gap-2 px-4 py-2">
      <h2 className="text-lg font-semibold">Mon CV Master</h2>
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
