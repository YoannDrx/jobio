"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { CreateProfileInput } from "@/features/profiles/profiles.schema";
import { LinkedInPdfImport } from "./linkedin-pdf-import";
import { LinkedInImport } from "./linkedin-import";
import { LinkedInImportGuide } from "./linkedin-import-guide";

type LinkedInImportTabsProps = {
  onImport: (data: Partial<CreateProfileInput>) => void;
};

export function LinkedInImportTabs({ onImport }: LinkedInImportTabsProps) {
  return (
    <Tabs defaultValue="pdf">
      <TabsList className="w-full">
        <TabsTrigger value="pdf" className="flex-1">
          PDF
        </TabsTrigger>
        <TabsTrigger value="text" className="flex-1">
          Texte
        </TabsTrigger>
        <TabsTrigger value="guide" className="flex-1">
          Guide
        </TabsTrigger>
      </TabsList>
      <TabsContent value="pdf" className="mt-4">
        <LinkedInPdfImport onImport={onImport} />
      </TabsContent>
      <TabsContent value="text" className="mt-4">
        <LinkedInImport onImport={onImport} />
      </TabsContent>
      <TabsContent value="guide" className="mt-4">
        <LinkedInImportGuide />
      </TabsContent>
    </Tabs>
  );
}
