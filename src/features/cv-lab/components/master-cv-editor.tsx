"use client";

import { Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DocumentStudioLayout } from "@/components/nowts/document-studio-layout";
import { CvLabPreview } from "./cv-lab-preview";
import { MasterCvToolbar } from "./master-cv-toolbar";
import { MasterCvSectionRouter } from "./master-cv-sections/master-cv-section-router";
import { useMasterCvStudio } from "../hooks/use-master-cv-studio";

export function MasterCvEditor() {
  const {
    masterCv,
    isLoading,
    isSaving,
    isImporting,
    editPanelOpen,
    setEditPanelOpen,
    activeSection,
    previewHtml,
    isPreviewLoading,
    fileInputRef,
    handleCreate,
    handleUpdate,
    handleAddItem,
    handleUpdateItem,
    handleRemoveItem,
    handleImportFromProfile,
    handleImportFromFile,
    handleSectionClick,
  } = useMasterCvStudio();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="size-6 animate-spin" />
      </div>
    );
  }

  if (!masterCv) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>CV Master</CardTitle>
            <CardDescription>
              Le CV Master est votre repertoire exhaustif de toutes vos
              experiences, competences et formations. Il sert de base pour
              generer des CV adaptes a chaque candidature.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button onClick={handleCreate} disabled={isSaving}>
              {isSaving ? "Creation..." : "Creer mon CV Master"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div data-full-width>
      <DocumentStudioLayout
        toolbar={
          <MasterCvToolbar
            isImporting={isImporting}
            onImportFromProfile={handleImportFromProfile}
            onImportFromFile={() => {
              fileInputRef.current?.click();
            }}
          />
        }
        preview={
          <div className="flex w-full flex-col items-center">
            <div className="mb-2 flex w-full max-w-[794px] justify-end gap-2">
              <Button
                size="sm"
                variant={editPanelOpen ? "secondary" : "outline"}
                onClick={() => setEditPanelOpen(!editPanelOpen)}
              >
                {editPanelOpen ? "Fermer" : "Éditer"}
              </Button>
            </div>
            <CvLabPreview
              previewHtml={previewHtml}
              previewError={null}
              isPreviewLoading={isPreviewLoading}
              onSectionClick={handleSectionClick}
            />
          </div>
        }
        editPanelOpen={editPanelOpen}
        onEditPanelOpenChange={setEditPanelOpen}
        editPanelTitle={
          activeSection
            ? {
                personal: "Infos personnelles",
                experiences: "Expériences",
                skills: "Compétences",
                education: "Formation",
                projects: "Projets",
                languages: "Langues",
                certifications: "Certifications",
              }[activeSection]
            : "Éditer"
        }
        editPanelContent={
          <MasterCvSectionRouter
            masterCv={masterCv}
            activeSection={activeSection}
            isSaving={isSaving}
            onUpdate={handleUpdate}
            onAddItem={handleAddItem}
            onUpdateItem={handleUpdateItem}
            onRemoveItem={handleRemoveItem}
          />
        }
      />
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            void handleImportFromFile(file);
            e.target.value = "";
          }
        }}
      />
    </div>
  );
}
