"use client";

import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";

type ExportCvButtonProps = {
  profileId: string;
};

export function ExportCvButton({ profileId }: ExportCvButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => {
        window.open(`/api/profiles/cv?profileId=${profileId}`, "_blank");
      }}
    >
      <FileDown className="mr-2 size-4" />
      Exporter CV
    </Button>
  );
}
