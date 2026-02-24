"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQueryState, parseAsString } from "nuqs";
import { BookOpen, FileText, Sparkles } from "lucide-react";
import { CvLabStudio } from "./cv-lab-studio";
import { CvCoachStudio } from "./cv-coach-studio";
import { MasterCvEditor } from "./master-cv-editor";

const TAB_VALUES = ["master", "editor", "coach"] as const;
type TabValue = (typeof TAB_VALUES)[number];

export function CvStudioPage() {
  const [tab, setTab] = useQueryState(
    "tab",
    parseAsString.withDefault("master"),
  );

  const activeTab: TabValue = TAB_VALUES.includes(tab as TabValue)
    ? (tab as TabValue)
    : "master";

  return (
    <Tabs
      value={activeTab}
      onValueChange={async (value) => setTab(value)}
      className="flex h-full flex-col"
    >
      <div className="px-4 py-2">
        <TabsList>
          <TabsTrigger value="master" className="gap-2">
            <BookOpen className="size-4" />
            CV Master
          </TabsTrigger>
          <TabsTrigger value="editor" className="gap-2">
            <FileText className="size-4" />
            Mes CVs
          </TabsTrigger>
          <TabsTrigger value="coach" className="gap-2">
            <Sparkles className="size-4" />
            Coach IA
          </TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="master" className="mt-0 flex-1">
        <MasterCvEditor />
      </TabsContent>
      <TabsContent value="editor" className="mt-0 flex-1">
        <CvLabStudio />
      </TabsContent>
      <TabsContent value="coach" className="mt-0 flex-1">
        <CvCoachStudio />
      </TabsContent>
    </Tabs>
  );
}
