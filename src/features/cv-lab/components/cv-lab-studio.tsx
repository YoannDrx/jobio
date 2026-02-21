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
  personalInfoOverridesSchema,
} from "@/features/cv-lab/cv-lab.schema";
import { ArrowLeft, PencilLine, Save } from "lucide-react";
import { useMemo } from "react";
import { useCvLabStudio } from "../hooks/use-cv-lab-studio";

export function CvLabStudio() {
  const {
    profiles,
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
  } = useCvLabStudio();

  const parsedContentOverrides = useMemo(() => {
    if (!selectedDocument) return undefined;
    const raw = (selectedDocument as Record<string, unknown>).contentOverrides;
    if (!raw) return undefined;
    const result = contentOverridesSchema.safeParse(raw);
    return result.success ? result.data : undefined;
  }, [selectedDocument]);

  const parsedPersonalInfo = useMemo(() => {
    if (!selectedDocument) return undefined;
    const raw = (selectedDocument as Record<string, unknown>).personalInfo;
    if (!raw) return undefined;
    const result = personalInfoOverridesSchema.safeParse(raw);
    return result.success ? result.data : undefined;
  }, [selectedDocument]);

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
            documentId={selectedDocument.id}
            contentOverrides={parsedContentOverrides}
            personalInfo={parsedPersonalInfo}
            onOverridesSaved={handleProfileSaved}
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
        />
      )
    ) : null;

  return (
    <div data-full-width className="flex flex-col gap-3">
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
            <Card>
              <CardHeader>
                <CardTitle>CV Lab</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Aucun document sélectionné.
                </p>
              </CardContent>
            </Card>
          ) : undefined
        }
      />
    </div>
  );
}
