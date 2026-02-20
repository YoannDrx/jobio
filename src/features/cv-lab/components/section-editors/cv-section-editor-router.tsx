"use client";

import type {
  ContentOverrides,
  PersonalInfoOverrides,
} from "@/features/cv-lab/cv-lab.schema";
import { CvSectionEditorHeader } from "./cv-section-editor-header";
import { CvSectionEditorSummary } from "./cv-section-editor-summary";
import { CvSectionEditorExperiences } from "./cv-section-editor-experiences";
import { CvSectionEditorSkills } from "./cv-section-editor-skills";
import { CvSectionEditorEducation } from "./cv-section-editor-education";
import { CvSectionEditorProjects } from "./cv-section-editor-projects";
import { CvSectionEditorLanguages } from "./cv-section-editor-languages";
import { CvSectionEditorCertifications } from "./cv-section-editor-certifications";
import { Info, PenLine } from "lucide-react";

type CvProfile = {
  id: string;
  name: string;
  headline: string;
  bio: string | null;
  experiences: unknown;
  skills: unknown;
  education: unknown;
  projects: unknown;
  languages: unknown;
  certifications: unknown;
};

type Draft = {
  headlineOverride: string;
  summaryOverride: string;
};

type CvSectionEditorRouterProps = {
  section: string;
  profile: CvProfile;
  draft: Draft;
  onDraftChange: (patch: Partial<Draft>) => void;
  onProfileSaved: () => Promise<void>;
  documentId?: string;
  contentOverrides?: ContentOverrides;
  personalInfo?: PersonalInfoOverrides;
  onOverridesSaved?: () => Promise<void>;
};

const SECTION_TITLES: Record<string, string> = {
  header: "En-tete / Identite",
  summary: "Resume",
  experiences: "Experiences",
  skills: "Competences",
  education: "Formation",
  projects: "Projets",
  languages: "Langues",
  certifications: "Certifications",
};

export function CvSectionEditorRouter({
  section,
  profile,
  draft,
  onDraftChange,
  onProfileSaved,
  documentId,
  contentOverrides,
  personalInfo,
  onOverridesSaved,
}: CvSectionEditorRouterProps) {
  const title = SECTION_TITLES[section] ?? section;
  const isOverrideMode = Boolean(documentId);

  const renderEditor = () => {
    switch (section) {
      case "header":
        return (
          <CvSectionEditorHeader
            profile={profile}
            draft={draft}
            onDraftChange={onDraftChange}
            documentId={documentId}
            personalInfo={personalInfo}
            onOverridesSaved={onOverridesSaved}
          />
        );
      case "summary":
        return (
          <CvSectionEditorSummary
            profile={profile}
            draft={draft}
            onDraftChange={onDraftChange}
          />
        );
      case "experiences":
        return (
          <CvSectionEditorExperiences
            profile={profile}
            onProfileSaved={onProfileSaved}
            documentId={documentId}
            overrides={contentOverrides?.experiences}
            onOverridesSaved={onOverridesSaved}
          />
        );
      case "skills":
        return (
          <CvSectionEditorSkills
            profile={profile}
            onProfileSaved={onProfileSaved}
            documentId={documentId}
            overrides={contentOverrides?.skills}
            onOverridesSaved={onOverridesSaved}
          />
        );
      case "education":
        return (
          <CvSectionEditorEducation
            profile={profile}
            onProfileSaved={onProfileSaved}
            documentId={documentId}
            overrides={contentOverrides?.education}
            onOverridesSaved={onOverridesSaved}
          />
        );
      case "projects":
        return (
          <CvSectionEditorProjects
            profile={profile}
            onProfileSaved={onProfileSaved}
            documentId={documentId}
            overrides={contentOverrides?.projects}
            onOverridesSaved={onOverridesSaved}
          />
        );
      case "languages":
        return (
          <CvSectionEditorLanguages
            profile={profile}
            onProfileSaved={onProfileSaved}
            documentId={documentId}
            overrides={contentOverrides?.languages}
            onOverridesSaved={onOverridesSaved}
          />
        );
      case "certifications":
        return (
          <CvSectionEditorCertifications
            profile={profile}
            onProfileSaved={onProfileSaved}
            documentId={documentId}
            overrides={contentOverrides?.certifications}
            onOverridesSaved={onOverridesSaved}
          />
        );
      default:
        return (
          <p className="text-muted-foreground text-sm">
            Section &quot;{section}&quot; non reconnue.
          </p>
        );
    }
  };

  const isProfileSection = [
    "experiences",
    "skills",
    "education",
    "projects",
    "languages",
    "certifications",
  ].includes(section);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm font-semibold">{title}</p>
      {isProfileSection ? (
        isOverrideMode ? (
          <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950">
            <PenLine className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <p className="text-xs text-amber-800 dark:text-amber-300">
              Modifications locales a ce CV. Le CV Master n&apos;est pas
              affecte.
            </p>
          </div>
        ) : (
          <div className="flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950">
            <Info className="mt-0.5 size-4 shrink-0 text-blue-600 dark:text-blue-400" />
            <p className="text-xs text-blue-800 dark:text-blue-300">
              Ces informations proviennent de votre profil. Les modifications
              seront repercutees sur tous les CV utilisant ce profil.
            </p>
          </div>
        )
      ) : null}
      {renderEditor()}
    </div>
  );
}
