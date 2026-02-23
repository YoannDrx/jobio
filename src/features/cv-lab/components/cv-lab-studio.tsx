"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DocumentStudioLayout } from "@/components/nowts/document-studio-layout";
import { CvLabPreview } from "./cv-lab-preview";
import { CvLabMinimalToolbar } from "./cv-lab-minimal-toolbar";
import { CvLabEditPanel } from "./cv-lab-edit-panel";
import { CvLabPanelContent } from "./cv-lab-panel-content";
import { CvSectionEditorRouter } from "./section-editors/cv-section-editor-router";
import {
  contentOverridesSchema,
  hiddenItemsSchema,
  personalInfoOverridesSchema,
  type MasterCvCertification,
  type MasterCvEducation,
  type MasterCvExperience,
  type MasterCvItem,
  type MasterCvLanguage,
  type MasterCvProject,
  type MasterCvSection,
  type MasterCvSkill,
} from "@/features/cv-lab/cv-lab.schema";
import { ArrowLeft, PencilLine, Plus, Save } from "lucide-react";
import { useMemo } from "react";
import { useCvLabStudio } from "../hooks/use-cv-lab-studio";
import { getServerUrl } from "@/lib/server-url";

const parseMasterItems = <T extends { id: string }>(value: unknown): T[] => {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is T =>
      item !== null &&
      typeof item === "object" &&
      !Array.isArray(item) &&
      typeof (item as { id?: unknown }).id === "string",
  );
};

export function CvLabStudio() {
  const {
    profiles,
    masterCv,
    documents,
    selectedDocumentId,
    selectedDocument,
    draft,
    versions,
    versionLabel,
    setVersionLabel,
    atsJobDescription,
    setAtsJobDescription,
    atsAnalysis,
    atsSuggestionPreview,
    atsSuggestionDiffItems,
    previewHtml,
    previewError,
    isPreviewLoading,
    canUseAllCvTemplates,
    compareLeftVersionId,
    setCompareLeftVersionId,
    compareRightReference,
    setCompareRightReference,
    compareLeftDraft,
    compareRightDraft,
    versionDiffItems,
    versionSectionLineDiffs,
    compareLeftLabel,
    compareRightLabel,
    recoverableLocalDraft,
    isLoading,
    isEditOpen,
    setIsEditOpen,
    editTab,
    setEditTab,
    activeProfileSection,
    setActiveProfileSection,
    importInputRef,
    hasUnsavedChanges,
    profileById,
    createMutation,
    saveMutation,
    duplicateMutation,
    archiveMutation,
    restoreDocumentMutation,
    deleteDocumentMutation,
    createVersionMutation,
    restoreVersionMutation,
    atsMutation,
    generateShareLinkMutation,
    revokeShareLinkMutation,
    exportPdfMutation,
    exportJsonMutation,
    importJsonMutation,
    handleDraftChange,
    handleSectionClick,
    handleProfileSaved,
    handleToggleSection,
    moveSection,
    resetDraftFromSavedDocument,
    restoreRecoverableLocalDraft,
    discardRecoverableLocalDraft,
    previewAtsSuggestions,
    applyAtsSuggestionsToDraft,
    cancelAtsPreview,
    handleImportInputChange,
    handleDeleteDocument,
    handleSelectDocument,
    setDocumentSource,
    toggleMasterItemVisibility,
    updateMasterItemOverride,
    removeMasterItemOverride,
  } = useCvLabStudio();

  const hasMasterCvSource = useMemo(() => {
    if (!selectedDocument) return false;
    const rawMasterCvId = (selectedDocument as Record<string, unknown>)
      .masterCvId;
    return typeof rawMasterCvId === "string" && rawMasterCvId.length > 0;
  }, [selectedDocument]);

  const parsedContentOverrides = useMemo(() => {
    if (!selectedDocument || !hasMasterCvSource) return undefined;
    const raw = (selectedDocument as Record<string, unknown>).contentOverrides;
    if (!raw) return undefined;
    const result = contentOverridesSchema.safeParse(raw);
    return result.success ? result.data : undefined;
  }, [hasMasterCvSource, selectedDocument]);

  const parsedPersonalInfo = useMemo(() => {
    if (!selectedDocument || !hasMasterCvSource) return undefined;
    const raw = (selectedDocument as Record<string, unknown>).personalInfo;
    if (!raw) return undefined;
    const result = personalInfoOverridesSchema.safeParse(raw);
    return result.success ? result.data : undefined;
  }, [hasMasterCvSource, selectedDocument]);

  const parsedHiddenItems = useMemo(() => {
    if (!selectedDocument || !hasMasterCvSource) return undefined;
    const raw = (selectedDocument as Record<string, unknown>).hiddenItems;
    if (!raw) return undefined;
    const result = hiddenItemsSchema.safeParse(raw);
    return result.success ? result.data : undefined;
  }, [hasMasterCvSource, selectedDocument]);

  const masterItems = useMemo(() => {
    if (!masterCv) return undefined;

    return {
      experiences: parseMasterItems<MasterCvExperience>(masterCv.experiences),
      skills: parseMasterItems<MasterCvSkill>(masterCv.skills),
      education: parseMasterItems<MasterCvEducation>(masterCv.education),
      projects: parseMasterItems<MasterCvProject>(masterCv.projects),
      languages: parseMasterItems<MasterCvLanguage>(masterCv.languages),
      certifications: parseMasterItems<MasterCvCertification>(
        masterCv.certifications,
      ),
    } satisfies Partial<Record<MasterCvSection, MasterCvItem[]>>;
  }, [masterCv]);

  const publicShareUrl = selectedDocument?.shareToken
    ? `${getServerUrl()}/p/cv/${selectedDocument.shareToken}`
    : null;

  if (isLoading) {
    return (
      <div data-full-width className="flex flex-col gap-3">
        <p className="text-muted-foreground text-sm">Chargement...</p>
      </div>
    );
  }

  const editPanelContentNode =
    selectedDocument && draft ? (
      activeProfileSection ? (
        <div className="flex flex-col gap-4">
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm"
            onClick={() => setActiveProfileSection(null)}
          >
            <ArrowLeft className="size-4" />
            Retour aux onglets
          </button>
          <CvSectionEditorRouter
            section={activeProfileSection}
            profile={
              profileById.get(draft.profileId) ?? {
                id: draft.profileId,
                name: "",
                headline: "",
                bio: null,
                experiences: null,
                skills: null,
                education: null,
                projects: null,
                languages: null,
                certifications: null,
              }
            }
            draft={draft}
            onDraftChange={handleDraftChange}
            onProfileSaved={handleProfileSaved}
            documentId={hasMasterCvSource ? selectedDocument.id : undefined}
            contentOverrides={parsedContentOverrides}
            personalInfo={parsedPersonalInfo}
            onOverridesSaved={
              hasMasterCvSource ? handleProfileSaved : undefined
            }
            masterItems={masterItems}
            hiddenItemIds={parsedHiddenItems}
            onToggleItem={toggleMasterItemVisibility}
            onUpdateOverride={updateMasterItemOverride}
            onRemoveOverride={removeMasterItemOverride}
          />
        </div>
      ) : (
        <CvLabEditPanel
          activeTab={editTab}
          onTabChange={setEditTab}
          draft={draft}
          onDraftChange={handleDraftChange}
          profiles={profiles}
          canUseAllCvTemplates={canUseAllCvTemplates}
          onToggleSection={handleToggleSection}
          onMoveSection={moveSection}
          versions={versions}
          versionLabel={versionLabel}
          onVersionLabelChange={setVersionLabel}
          onCreateVersion={() => createVersionMutation.mutate()}
          isCreatingVersion={createVersionMutation.isPending}
          onRestoreVersion={(versionId) =>
            restoreVersionMutation.mutate(versionId)
          }
          isRestoringVersion={restoreVersionMutation.isPending}
          compareLeftVersionId={compareLeftVersionId}
          onCompareLeftVersionIdChange={setCompareLeftVersionId}
          compareRightReference={compareRightReference}
          onCompareRightReferenceChange={setCompareRightReference}
          compareLeftDraft={compareLeftDraft}
          compareRightDraft={compareRightDraft}
          versionDiffItems={versionDiffItems}
          versionSectionLineDiffs={versionSectionLineDiffs}
          compareLeftLabel={compareLeftLabel}
          compareRightLabel={compareRightLabel}
          atsJobDescription={atsJobDescription}
          onAtsJobDescriptionChange={setAtsJobDescription}
          onAnalyzeAts={() => atsMutation.mutate()}
          isAnalyzingAts={atsMutation.isPending}
          atsAnalysis={atsAnalysis}
          atsSuggestionPreview={atsSuggestionPreview}
          atsSuggestionDiffItems={atsSuggestionDiffItems}
          onPreviewAtsSuggestions={previewAtsSuggestions}
          onApplyAtsSuggestions={applyAtsSuggestionsToDraft}
          onCancelAtsPreview={cancelAtsPreview}
          hasMasterCvSource={hasMasterCvSource}
          masterCv={
            masterCv
              ? {
                  id: masterCv.id,
                  fullName: masterCv.fullName,
                }
              : null
          }
          onDocumentSourceChange={setDocumentSource}
          masterItems={hasMasterCvSource ? masterItems : undefined}
          hiddenItemIds={hasMasterCvSource ? parsedHiddenItems : undefined}
          contentOverrides={hasMasterCvSource ? parsedContentOverrides : undefined}
          onToggleItem={
            hasMasterCvSource ? toggleMasterItemVisibility : undefined
          }
          onUpdateOverride={
            hasMasterCvSource ? updateMasterItemOverride : undefined
          }
          onRemoveOverride={
            hasMasterCvSource ? removeMasterItemOverride : undefined
          }
        />
      )
    ) : null;

  return (
    <div
      data-full-width
      className="mx-auto flex w-full max-w-[1320px] flex-col gap-3 px-3 sm:px-4 lg:px-6"
    >
      <DocumentStudioLayout
        toolbar={
          selectedDocument && draft ? (
            <CvLabMinimalToolbar
              documentName={draft.name}
              hasUnsavedChanges={hasUnsavedChanges}
              documents={documents}
              selectedDocumentId={selectedDocumentId}
              onSelectDocument={handleSelectDocument}
              onCreate={() => createMutation.mutate()}
              isCreating={createMutation.isPending}
            />
          ) : null
        }
        preview={
          selectedDocument && draft ? (
            <div className="flex w-full flex-col items-center">
              <div className="mb-2 flex w-full max-w-[794px] justify-end gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending || !hasUnsavedChanges}
                >
                  <Save className="mr-1 size-3.5" />
                  Enregistrer
                </Button>
                <Button
                  size="sm"
                  variant={isEditOpen ? "secondary" : "outline"}
                  onClick={() => setIsEditOpen(!isEditOpen)}
                >
                  <PencilLine className="mr-1 size-3.5" />
                  {isEditOpen ? "Fermer" : "Éditer"}
                </Button>
              </div>
              <CvLabPreview
                previewHtml={previewHtml}
                previewError={previewError}
                isPreviewLoading={isPreviewLoading}
                onSectionClick={handleSectionClick}
              />
            </div>
          ) : null
        }
        editPanelOpen={
          isEditOpen && Boolean(selectedDocument) && Boolean(draft)
        }
        onEditPanelOpenChange={setIsEditOpen}
        editPanelTitle={
          activeProfileSection ? "Éditer la section" : "Éditer le CV"
        }
        editPanelContent={
          selectedDocument && draft ? (
            <CvLabPanelContent
              editPanel={editPanelContentNode}
              recoverableLocalDraft={recoverableLocalDraft}
              onRestoreLocalDraft={restoreRecoverableLocalDraft}
              onDiscardLocalDraft={discardRecoverableLocalDraft}
              onDuplicate={() => duplicateMutation.mutate()}
              isDuplicating={duplicateMutation.isPending}
              onExportJson={() => exportJsonMutation.mutate()}
              isExportingJson={exportJsonMutation.isPending}
              onImportJson={() => importInputRef.current?.click()}
              isImportingJson={importJsonMutation.isPending}
              importInputRef={importInputRef}
              onImportInputChange={handleImportInputChange}
              previewHtml={previewHtml}
              publicShareUrl={publicShareUrl}
              onGenerateShareLink={() => generateShareLinkMutation.mutate()}
              isGeneratingShareLink={generateShareLinkMutation.isPending}
              onRevokeShareLink={() => revokeShareLinkMutation.mutate()}
              isRevokingShareLink={revokeShareLinkMutation.isPending}
              onExportPdf={() => exportPdfMutation.mutate()}
              isExportingPdf={exportPdfMutation.isPending}
              isArchived={Boolean(selectedDocument.archivedAt)}
              onArchive={() => archiveMutation.mutate()}
              isArchiving={archiveMutation.isPending}
              onRestore={() => restoreDocumentMutation.mutate()}
              isRestoring={restoreDocumentMutation.isPending}
              onDelete={handleDeleteDocument}
              isDeleting={deleteDocumentMutation.isPending}
              onReset={resetDraftFromSavedDocument}
              hasUnsavedChanges={hasUnsavedChanges}
            />
          ) : null
        }
        editPanelFooter={
          selectedDocument && draft ? (
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || !hasUnsavedChanges}
              className="w-full"
            >
              Enregistrer
            </Button>
          ) : null
        }
        emptyState={
          !selectedDocument || !draft ? (
            <div className="mx-auto w-full max-w-[860px] py-6">
              <Card className="relative">
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute top-4 right-4 h-8 gap-1.5 px-2.5 text-xs"
                  onClick={() => createMutation.mutate()}
                  disabled={
                    createMutation.isPending || profiles.length === 0
                  }
                >
                  <Plus className="size-3.5" />
                  {createMutation.isPending ? "Creation..." : "Nouveau CV"}
                </Button>
                <CardHeader className="pr-32">
                  <CardTitle>CV Lab</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  <p className="text-muted-foreground text-sm">
                    Aucun document sélectionné.
                  </p>
                  {profiles.length === 0 ? (
                    <p className="text-muted-foreground text-xs">
                      Creez d&apos;abord un profil pour demarrer CV Studio.
                    </p>
                  ) : null}
                </CardContent>
              </Card>
            </div>
          ) : undefined
        }
      />
    </div>
  );
}
