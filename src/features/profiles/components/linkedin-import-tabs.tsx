"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { CreateProfileInput } from "@/features/profiles/profiles.schema";
import { LinkedInPdfImport } from "./linkedin-pdf-import";
import { LinkedInImport } from "./linkedin-import";

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
      </TabsList>
      <TabsContent value="pdf" className="mt-4">
        <LinkedInPdfImport onImport={onImport} />
      </TabsContent>
      <TabsContent value="text" className="mt-4">
        <LinkedInImport onImport={onImport} />
      </TabsContent>
    </Tabs>
  );
}
