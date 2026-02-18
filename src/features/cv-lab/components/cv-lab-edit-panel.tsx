"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CvLabEditSettings } from "./cv-lab-edit-settings";
import { CvLabEditSections } from "./cv-lab-edit-sections";
import { CvLabEditVersions } from "./cv-lab-edit-versions";
import { CvLabEditAts } from "./cv-lab-edit-ats";
import type { CvLabSection, CvLabTemplate, CvLabTheme } from "../cv-lab.schema";
import type {
  AtsAnalysis,
  AtsSuggestionPreview,
  DraftDiffItem,
} from "./cv-lab-edit-ats";
import type { SectionLineDiff } from "./cv-lab-edit-versions";

type CvProfile = {
  id: string;
  name: string;
};

type Draft = {
  profileId: string;
  name: string;
  targetRole: string;
  template: CvLabTemplate;
  theme: CvLabTheme;
  accentColor: string;
  fontFamily: string;
  headlineOverride: string;
  summaryOverride: string;
  sectionOrder: CvLabSection[];
  hiddenSections: CvLabSection[];
};

export type CvLabEditTab = "settings" | "sections" | "versions" | "ats";

type CvLabEditPanelProps = {
  activeTab: CvLabEditTab;
  onTabChange: (tab: CvLabEditTab) => void;
  draft: Draft;
  onDraftChange: (patch: Partial<Draft>) => void;
  profiles: CvProfile[];
  onToggleSection: (section: CvLabSection, visible: boolean) => void;
  onMoveSection: (section: CvLabSection, direction: "up" | "down") => void;
  versions: {
    id: string;
    label: string;
    createdAt: string | Date;
  }[];
  versionLabel: string;
  onVersionLabelChange: (value: string) => void;
  onCreateVersion: () => void;
  isCreatingVersion: boolean;
  onRestoreVersion: (versionId: string) => void;
  isRestoringVersion: boolean;
  compareLeftVersionId: string;
  onCompareLeftVersionIdChange: (value: string) => void;
  compareRightReference: string;
  onCompareRightReferenceChange: (value: string) => void;
  compareLeftDraft: unknown;
  compareRightDraft: unknown;
  versionDiffItems: DraftDiffItem[];
  versionSectionLineDiffs: SectionLineDiff[];
  compareLeftLabel: string | null;
  compareRightLabel: string | null;
  atsJobDescription: string;
  onAtsJobDescriptionChange: (value: string) => void;
  onAnalyzeAts: () => void;
  isAnalyzingAts: boolean;
  atsAnalysis: AtsAnalysis | null;
  atsSuggestionPreview: AtsSuggestionPreview | null;
  atsSuggestionDiffItems: DraftDiffItem[];
  onPreviewAtsSuggestions: () => void;
  onApplyAtsSuggestions: () => void;
  onCancelAtsPreview: () => void;
};

export function CvLabEditPanel({
  activeTab,
  onTabChange,
  draft,
  onDraftChange,
  profiles,
  onToggleSection,
  onMoveSection,
  versions,
  versionLabel,
  onVersionLabelChange,
  onCreateVersion,
  isCreatingVersion,
  onRestoreVersion,
  isRestoringVersion,
  compareLeftVersionId,
  onCompareLeftVersionIdChange,
  compareRightReference,
  onCompareRightReferenceChange,
  compareLeftDraft,
  compareRightDraft,
  versionDiffItems,
  versionSectionLineDiffs,
  compareLeftLabel,
  compareRightLabel,
  atsJobDescription,
  onAtsJobDescriptionChange,
  onAnalyzeAts,
  isAnalyzingAts,
  atsAnalysis,
  atsSuggestionPreview,
  atsSuggestionDiffItems,
  onPreviewAtsSuggestions,
  onApplyAtsSuggestions,
  onCancelAtsPreview,
}: CvLabEditPanelProps) {
  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => onTabChange(value as CvLabEditTab)}
    >
      <TabsList className="w-full">
        <TabsTrigger value="settings">Paramètres</TabsTrigger>
        <TabsTrigger value="sections">Sections</TabsTrigger>
        <TabsTrigger value="versions">Versions</TabsTrigger>
        <TabsTrigger value="ats">ATS</TabsTrigger>
      </TabsList>

      <TabsContent value="settings">
        <CvLabEditSettings
          draft={draft}
          onDraftChange={onDraftChange}
          profiles={profiles}
        />
      </TabsContent>

      <TabsContent value="sections">
        <CvLabEditSections
          sectionOrder={draft.sectionOrder}
          hiddenSections={draft.hiddenSections}
          onToggleSection={onToggleSection}
          onMoveSection={onMoveSection}
        />
      </TabsContent>

      <TabsContent value="versions">
        <CvLabEditVersions
          versions={versions}
          versionLabel={versionLabel}
          onVersionLabelChange={onVersionLabelChange}
          onCreateVersion={onCreateVersion}
          isCreatingVersion={isCreatingVersion}
          onRestoreVersion={onRestoreVersion}
          isRestoringVersion={isRestoringVersion}
          compareLeftVersionId={compareLeftVersionId}
          onCompareLeftVersionIdChange={onCompareLeftVersionIdChange}
          compareRightReference={compareRightReference}
          onCompareRightReferenceChange={onCompareRightReferenceChange}
          compareLeftDraft={compareLeftDraft}
          compareRightDraft={compareRightDraft}
          versionDiffItems={versionDiffItems}
          versionSectionLineDiffs={versionSectionLineDiffs}
          compareLeftLabel={compareLeftLabel}
          compareRightLabel={compareRightLabel}
        />
      </TabsContent>

      <TabsContent value="ats">
        <CvLabEditAts
          atsJobDescription={atsJobDescription}
          onAtsJobDescriptionChange={onAtsJobDescriptionChange}
          onAnalyze={onAnalyzeAts}
          isAnalyzing={isAnalyzingAts}
          hasDraft={true}
          atsAnalysis={atsAnalysis}
          atsSuggestionPreview={atsSuggestionPreview}
          atsSuggestionDiffItems={atsSuggestionDiffItems}
          onPreviewSuggestions={onPreviewAtsSuggestions}
          onApplySuggestions={onApplyAtsSuggestions}
          onCancelPreview={onCancelAtsPreview}
        />
      </TabsContent>
    </Tabs>
  );
}
