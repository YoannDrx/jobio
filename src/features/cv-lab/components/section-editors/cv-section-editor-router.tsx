"use client";

import { CvSectionEditorHeader } from "./cv-section-editor-header";
import { CvSectionEditorSummary } from "./cv-section-editor-summary";
import { CvSectionEditorExperiences } from "./cv-section-editor-experiences";
import { CvSectionEditorSkills } from "./cv-section-editor-skills";
import { CvSectionEditorEducation } from "./cv-section-editor-education";
import { CvSectionEditorProjects } from "./cv-section-editor-projects";
import { CvSectionEditorLanguages } from "./cv-section-editor-languages";
import { CvSectionEditorCertifications } from "./cv-section-editor-certifications";

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
};

const SECTION_TITLES: Record<string, string> = {
  header: "En-tête / Identité",
  summary: "Résumé",
  experiences: "Expériences",
  skills: "Compétences",
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
}: CvSectionEditorRouterProps) {
  const title = SECTION_TITLES[section] ?? section;

  const renderEditor = () => {
    switch (section) {
      case "header":
        return (
          <CvSectionEditorHeader
            profile={profile}
            draft={draft}
            onDraftChange={onDraftChange}
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
          />
        );
      case "skills":
        return (
          <CvSectionEditorSkills
            profile={profile}
            onProfileSaved={onProfileSaved}
          />
        );
      case "education":
        return (
          <CvSectionEditorEducation
            profile={profile}
            onProfileSaved={onProfileSaved}
          />
        );
      case "projects":
        return (
          <CvSectionEditorProjects
            profile={profile}
            onProfileSaved={onProfileSaved}
          />
        );
      case "languages":
        return (
          <CvSectionEditorLanguages
            profile={profile}
            onProfileSaved={onProfileSaved}
          />
        );
      case "certifications":
        return (
          <CvSectionEditorCertifications
            profile={profile}
            onProfileSaved={onProfileSaved}
          />
        );
      default:
        return (
          <p className="text-muted-foreground text-sm">
            Section "{section}" non reconnue.
          </p>
        );
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm font-semibold">{title}</p>
      {renderEditor()}
    </div>
  );
}
