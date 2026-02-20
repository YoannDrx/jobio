"use client";

import { Badge } from "@/components/ui/badge";
import {
  Briefcase,
  GraduationCap,
  Award,
  Globe,
  FolderOpen,
  Wrench,
  UserRound,
} from "lucide-react";
import { PersonalInfoSection } from "./master-cv-section-personal-info";
import { ExperiencesSection } from "./master-cv-section-experiences";
import { SkillsSection } from "./master-cv-section-skills";
import { EducationSection } from "./master-cv-section-education";
import { ProjectsSection } from "./master-cv-section-projects";
import { LanguagesSection } from "./master-cv-section-languages";
import { CertificationsSection } from "./master-cv-section-certifications";
import type {
  MasterCvCertification,
  MasterCvEducation,
  MasterCvExperience,
  MasterCvLanguage,
  MasterCvProject,
  MasterCvSkill,
} from "../../cv-lab.schema";

type MasterCvData = {
  id: string;
  fullName: string;
  headline: string | null;
  summary: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  photoUrl: string | null;
  hobbies: unknown;
  driverLicenses: unknown;
  experiences: unknown;
  skills: unknown;
  education: unknown;
  projects: unknown;
  languages: unknown;
  certifications: unknown;
};

type MasterCvSection =
  | "personal"
  | "experiences"
  | "skills"
  | "education"
  | "projects"
  | "languages"
  | "certifications";

type MasterCvSectionRouterProps = {
  masterCv: MasterCvData;
  activeSection: MasterCvSection | null;
  isSaving: boolean;
  onUpdate: (patch: Record<string, unknown>) => Promise<void>;
  onAddItem: (section: string, item: Record<string, unknown>) => Promise<void>;
  onUpdateItem: (
    section: string,
    itemId: string,
    patch: Record<string, unknown>,
  ) => Promise<void>;
  onRemoveItem: (section: string, itemId: string) => Promise<void>;
};

const parseArray = <T extends { id: string }>(value: unknown): T[] => {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is T =>
      item !== null && typeof item === "object" && "id" in item,
  );
};

export function MasterCvSectionRouter({
  masterCv,
  activeSection,
  isSaving,
  onUpdate,
  onAddItem,
  onUpdateItem,
  onRemoveItem,
}: MasterCvSectionRouterProps) {
  const experiences = parseArray<MasterCvExperience>(masterCv.experiences);
  const skills = parseArray<MasterCvSkill>(masterCv.skills);
  const education = parseArray<MasterCvEducation>(masterCv.education);
  const projects = parseArray<MasterCvProject>(masterCv.projects);
  const languages = parseArray<MasterCvLanguage>(masterCv.languages);
  const certifications = parseArray<MasterCvCertification>(
    masterCv.certifications,
  );

  if (!activeSection) {
    return (
      <div className="flex items-center justify-center p-8 text-center">
        <p className="text-muted-foreground">Sélectionnez une section</p>
      </div>
    );
  }

  switch (activeSection) {
    case "personal":
      return (
        <div className="flex flex-col gap-4 overflow-y-auto p-4">
          <div className="flex items-center gap-2 border-b pb-3">
            <UserRound className="size-5" />
            <h3 className="font-semibold">Informations personnelles</h3>
          </div>
          <PersonalInfoSection
            data={masterCv}
            onSave={onUpdate}
            isSaving={isSaving}
          />
        </div>
      );

    case "experiences":
      return (
        <div className="flex flex-col gap-4 overflow-y-auto p-4">
          <div className="flex items-center gap-2 border-b pb-3">
            <Briefcase className="size-5" />
            <h3 className="font-semibold">Expériences</h3>
            <Badge variant="secondary">{experiences.length}</Badge>
          </div>
          <ExperiencesSection
            items={experiences}
            onAdd={onAddItem}
            onUpdate={onUpdateItem}
            onRemove={onRemoveItem}
          />
        </div>
      );

    case "skills":
      return (
        <div className="flex flex-col gap-4 overflow-y-auto p-4">
          <div className="flex items-center gap-2 border-b pb-3">
            <Wrench className="size-5" />
            <h3 className="font-semibold">Compétences</h3>
            <Badge variant="secondary">{skills.length}</Badge>
          </div>
          <SkillsSection
            items={skills}
            onAdd={onAddItem}
            onUpdate={onUpdateItem}
            onRemove={onRemoveItem}
          />
        </div>
      );

    case "education":
      return (
        <div className="flex flex-col gap-4 overflow-y-auto p-4">
          <div className="flex items-center gap-2 border-b pb-3">
            <GraduationCap className="size-5" />
            <h3 className="font-semibold">Formation</h3>
            <Badge variant="secondary">{education.length}</Badge>
          </div>
          <EducationSection
            items={education}
            onAdd={onAddItem}
            onUpdate={onUpdateItem}
            onRemove={onRemoveItem}
          />
        </div>
      );

    case "projects":
      return (
        <div className="flex flex-col gap-4 overflow-y-auto p-4">
          <div className="flex items-center gap-2 border-b pb-3">
            <FolderOpen className="size-5" />
            <h3 className="font-semibold">Projets</h3>
            <Badge variant="secondary">{projects.length}</Badge>
          </div>
          <ProjectsSection
            items={projects}
            onAdd={onAddItem}
            onUpdate={onUpdateItem}
            onRemove={onRemoveItem}
          />
        </div>
      );

    case "languages":
      return (
        <div className="flex flex-col gap-4 overflow-y-auto p-4">
          <div className="flex items-center gap-2 border-b pb-3">
            <Globe className="size-5" />
            <h3 className="font-semibold">Langues</h3>
            <Badge variant="secondary">{languages.length}</Badge>
          </div>
          <LanguagesSection
            items={languages}
            onAdd={onAddItem}
            onUpdate={onUpdateItem}
            onRemove={onRemoveItem}
          />
        </div>
      );

    case "certifications":
      return (
        <div className="flex flex-col gap-4 overflow-y-auto p-4">
          <div className="flex items-center gap-2 border-b pb-3">
            <Award className="size-5" />
            <h3 className="font-semibold">Certifications</h3>
            <Badge variant="secondary">{certifications.length}</Badge>
          </div>
          <CertificationsSection
            items={certifications}
            onAdd={onAddItem}
            onUpdate={onUpdateItem}
            onRemove={onRemoveItem}
          />
        </div>
      );

    default:
      return null;
  }
}
