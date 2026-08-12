"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  BotIcon,
  FileText,
  FileUp,
  Loader2,
  Save,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  EditSideSheet,
  EditSideSheetBody,
  EditSideSheetContent,
  EditSideSheetFooter,
  EditSideSheetHeader,
} from "@/components/nowts/edit-side-sheet";
import { DocumentStudioLayout } from "@/components/nowts/document-studio-layout";
import { useCvCoachStudio } from "../hooks/use-cv-coach-studio";
import { CvCoachToolbar } from "./cv-coach-toolbar";
import { CvCoachChatPanel } from "./cv-coach-chat-panel";
import { CvCoachDossierPanel } from "./cv-coach-dossier-panel";

export function CvCoachStudio() {
  const {
    profiles,
    sessions,
    activeSession,
    sessionNameInput,
    goalRoleInput,
    messageInput,
    applyProfileId,
    applyMode,
    isLoading,
    isCreating,
    isSending,
    isStreaming,
    streamingText,
    isSavingSnapshot,
    isApplyingToProfile,
    isArchiving,
    importDialogOpen,
    importText,
    isImporting,
    importTab,
    fileUploadState,
    fileUploadActions,
    editedSnapshot,
    lockedFields,
    isExtracting,
    dossierPanelOpen,
    messagesEndRef,
    setSessionNameInput,
    setGoalRoleInput,
    setMessageInput,
    setApplyProfileId,
    setApplyMode,
    setImportDialogOpen,
    setImportText,
    setImportTab,
    setEditedSnapshot,
    setDossierPanelOpen,
    handleCreateSession,
    handleSelectSession,
    handleSendMessage,
    handleSaveSnapshot,
    handleApplyToProfile,
    handleArchiveSession,
    handleCreateVariant,
    handleToggleLock,
    handleImportText,
    handleImportFile,
    handleQuickQuestion,
    handleAskMissingQuestion,
  } = useCvCoachStudio();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 p-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div data-full-width>
      <DocumentStudioLayout
        contentMode="full"
        toolbar={
          <CvCoachToolbar
            sessions={sessions}
            activeSession={
              activeSession
                ? {
                    name: activeSession.name,
                    completenessScore: activeSession.completenessScore,
                  }
                : null
            }
            sessionNameInput={sessionNameInput}
            goalRoleInput={goalRoleInput}
            onSessionNameChange={setSessionNameInput}
            onGoalRoleChange={setGoalRoleInput}
            onSelectSession={handleSelectSession}
            onCreateSession={handleCreateSession}
            isCreating={isCreating}
            onOpenImport={() => setImportDialogOpen(true)}
            importDisabled={!activeSession}
          />
        }
        preview={
          activeSession && editedSnapshot ? (
            <CvCoachChatPanel
              session={activeSession}
              messageInput={messageInput}
              onMessageInputChange={setMessageInput}
              onSend={handleSendMessage}
              isSending={isSending}
              isStreaming={isStreaming}
              isExtracting={isExtracting}
              streamingText={streamingText}
              messagesEndRef={messagesEndRef}
              onQuickQuestion={handleQuickQuestion}
              onOpenDossier={() => setDossierPanelOpen(true)}
              snapshot={editedSnapshot}
            />
          ) : null
        }
        editPanelOpen={dossierPanelOpen}
        onEditPanelOpenChange={setDossierPanelOpen}
        editPanelTitle="Dossier"
        editPanelWidth={440}
        editPanelContent={
          activeSession && editedSnapshot ? (
            <CvCoachDossierPanel
              session={activeSession}
              snapshot={editedSnapshot}
              onSnapshotChange={setEditedSnapshot}
              profiles={profiles}
              applyProfileId={applyProfileId}
              applyMode={applyMode}
              onApplyProfileIdChange={setApplyProfileId}
              onApplyModeChange={setApplyMode}
              onApplyToProfile={handleApplyToProfile}
              isApplyingToProfile={isApplyingToProfile}
              onArchive={handleArchiveSession}
              isArchiving={isArchiving}
              onAskMissingQuestion={handleAskMissingQuestion}
              onCreateVariant={handleCreateVariant}
              onScrollToMessage={(_index: number) => {
                const element = messagesEndRef.current;
                if (element) {
                  element.scrollIntoView({ behavior: "smooth" });
                }
              }}
              lockedFields={lockedFields}
              onToggleLock={handleToggleLock}
            />
          ) : null
        }
        editPanelFooter={
          activeSession && editedSnapshot ? (
            <Button
              className="w-full"
              onClick={handleSaveSnapshot}
              disabled={isSavingSnapshot}
            >
              {isSavingSnapshot ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              {isSavingSnapshot ? "Sauvegarde en cours..." : "Sauvegarder"}
            </Button>
          ) : undefined
        }
        emptyState={
          !activeSession ? (
            <Card className="flex min-h-[400px] items-center justify-center">
              <CardContent className="text-center">
                <div className="bg-muted mx-auto mb-4 flex size-16 items-center justify-center rounded-full">
                  <BotIcon className="text-muted-foreground size-8" />
                </div>
                <p className="text-lg font-semibold">CV Coach IA</p>
                <p className="text-muted-foreground mt-1 text-sm">
                  Crée une session pour commencer l&apos;entretien CV guidé.
                </p>
                <Button
                  className="mt-4"
                  onClick={handleCreateSession}
                  disabled={isCreating}
                >
                  {isCreating ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <BotIcon className="size-4" />
                  )}
                  {isCreating ? "Création..." : "Nouvelle session"}
                </Button>
              </CardContent>
            </Card>
          ) : undefined
        }
      />

      {/* Import Sheet */}
      <EditSideSheet open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <EditSideSheetContent>
          <EditSideSheetHeader
            title="Importer un CV existant"
            description="Importe ton CV depuis un fichier PDF/DOCX ou colle le texte directement. Le coach l'analysera automatiquement."
          />
          <EditSideSheetBody>
            <Tabs value={importTab} onValueChange={setImportTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="text">Texte</TabsTrigger>
                <TabsTrigger value="file">Fichier</TabsTrigger>
              </TabsList>
              <TabsContent value="text" className="mt-4">
                <Textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="Colle le contenu de ton CV ici..."
                  className="min-h-[200px]"
                />
              </TabsContent>
              <TabsContent value="file" className="mt-4">
                <div
                  className={`rounded-lg border-2 border-dashed p-8 transition-colors ${
                    fileUploadState.isDragging
                      ? "border-primary bg-primary/5"
                      : "border-muted-foreground/25"
                  } ${fileUploadState.files.length > 0 ? "bg-muted/50" : ""}`}
                  onDragEnter={fileUploadActions.handleDragEnter}
                  onDragLeave={fileUploadActions.handleDragLeave}
                  onDragOver={fileUploadActions.handleDragOver}
                  onDrop={fileUploadActions.handleDrop}
                >
                  {fileUploadState.files.length > 0 ? (
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="text-primary size-8" />
                      <p className="text-sm font-medium">
                        {fileUploadState.files[0].file.name}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {(
                          fileUploadState.files[0].file.size /
                          1024 /
                          1024
                        ).toFixed(2)}{" "}
                        Mo
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          fileUploadActions.removeFile(
                            fileUploadState.files[0].id,
                          )
                        }
                        className="text-destructive hover:text-destructive/80 mt-2 text-xs"
                      >
                        <X className="mr-1 inline size-3" />
                        Supprimer
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="text-muted-foreground size-8" />
                      <p className="text-sm font-medium">
                        Glisse-dépose ton fichier ici
                      </p>
                      <p className="text-muted-foreground text-xs">
                        PDF ou DOCX, max 5 Mo
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={fileUploadActions.openFileDialog}
                      >
                        Sélectionner un fichier
                      </Button>
                      <input
                        {...fileUploadActions.getInputProps()}
                        className="sr-only"
                      />
                    </div>
                  )}
                  {fileUploadState.errors.length > 0 && (
                    <p className="text-destructive mt-2 text-center text-xs">
                      {fileUploadState.errors[0]}
                    </p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </EditSideSheetBody>
          <EditSideSheetFooter>
            <Button
              variant="outline"
              onClick={() => setImportDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button
              onClick={
                importTab === "text" ? handleImportText : handleImportFile
              }
              disabled={
                isImporting ||
                (importTab === "text" && !importText.trim()) ||
                (importTab === "file" && fileUploadState.files.length === 0)
              }
            >
              {isImporting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Import...
                </>
              ) : (
                <>
                  <FileUp className="size-4" />
                  Importer et analyser
                </>
              )}
            </Button>
          </EditSideSheetFooter>
        </EditSideSheetContent>
      </EditSideSheet>
    </div>
  );
}
