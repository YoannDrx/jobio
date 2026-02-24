import type { Prisma } from "@/generated/prisma";
import type {
  ContentOverrides,
  HiddenItems,
  MasterCvCertification,
  MasterCvEducation,
  MasterCvExperience,
  MasterCvLanguage,
  MasterCvProject,
  MasterCvSection,
  MasterCvSkill,
  PersonalInfoOverrides,
  SocialLinks,
} from "./cv-lab.schema";
import { MASTER_CV_SECTIONS } from "./cv-lab.schema";

// --- Types ---

export type ResolvedCvContent = {
  fullName: string;
  headline: string | null;
  summary: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  photoUrl: string | null;
  hobbies: string[];
  driverLicenses: string[];
  socialLinks: SocialLinks;
  experiences: MasterCvExperience[];
  skills: MasterCvSkill[];
  education: MasterCvEducation[];
  projects: MasterCvProject[];
  languages: MasterCvLanguage[];
  certifications: MasterCvCertification[];
};

type MasterCvData = {
  fullName: string;
  headline: string | null;
  summary: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  photoUrl: string | null;
  hobbies: Prisma.JsonValue;
  driverLicenses: Prisma.JsonValue;
  socialLinks: Prisma.JsonValue;
  experiences: Prisma.JsonValue;
  skills: Prisma.JsonValue;
  education: Prisma.JsonValue;
  projects: Prisma.JsonValue;
  languages: Prisma.JsonValue;
  certifications: Prisma.JsonValue;
};

type DocumentOverrides = {
  contentOverrides: Prisma.JsonValue;
  hiddenItems: Prisma.JsonValue;
  personalInfo: Prisma.JsonValue;
};

// --- Helpers ---

const parseJsonArray = <T extends { id: string }>(
  value: Prisma.JsonValue | null | undefined,
): T[] => {
  if (!Array.isArray(value)) return [];
  return (value as unknown[]).filter(
    (item): item is T =>
      item !== null &&
      typeof item === "object" &&
      !Array.isArray(item) &&
      "id" in (item as Record<string, unknown>),
  );
};

const parseStringArray = (
  value: Prisma.JsonValue | null | undefined,
): string[] => {
  if (!Array.isArray(value)) return [];
  return (value as unknown[]).filter(
    (item): item is string => typeof item === "string",
  );
};

const parseSocialLinks = (
  value: Prisma.JsonValue | null | undefined,
): SocialLinks => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const obj = value as Record<string, unknown>;
  return {
    linkedinUrl:
      typeof obj.linkedinUrl === "string" ? obj.linkedinUrl : undefined,
    githubUrl: typeof obj.githubUrl === "string" ? obj.githubUrl : undefined,
    websiteUrl: typeof obj.websiteUrl === "string" ? obj.websiteUrl : undefined,
    maltUrl: typeof obj.maltUrl === "string" ? obj.maltUrl : undefined,
  };
};

const parseContentOverrides = (
  value: Prisma.JsonValue | null | undefined,
): ContentOverrides => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as unknown as ContentOverrides;
};

const parseHiddenItems = (
  value: Prisma.JsonValue | null | undefined,
): Partial<HiddenItems> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as unknown as Partial<HiddenItems>;
};

const parsePersonalInfo = (
  value: Prisma.JsonValue | null | undefined,
): PersonalInfoOverrides => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as unknown as PersonalInfoOverrides;
};

const filterHiddenItems = <T extends { id: string }>(
  items: T[],
  hiddenIds: string[] | undefined,
): T[] => {
  if (!hiddenIds || hiddenIds.length === 0) return items;
  const hiddenSet = new Set(hiddenIds);
  return items.filter((item) => !hiddenSet.has(item.id));
};

type OverrideEntry = Record<string, unknown> & { masterItemId: string };

const applyOverrides = <T extends { id: string }>(
  items: T[],
  overrides: OverrideEntry[] | undefined,
): T[] => {
  if (!overrides || overrides.length === 0) return items;

  const overrideMap = new Map(overrides.map((o) => [o.masterItemId, o]));

  return items.map((item) => {
    const override = overrideMap.get(item.id);
    if (!override) return item;

    const merged = { ...item };
    for (const [key, value] of Object.entries(override)) {
      if (key === "masterItemId") continue;
      if (value !== undefined && value !== null) {
        (merged as Record<string, unknown>)[key] = value;
      }
    }
    return merged;
  });
};

// --- Main resolver ---

export function resolveCvContent(
  masterCv: MasterCvData,
  document: DocumentOverrides,
): ResolvedCvContent {
  const contentOverrides = parseContentOverrides(document.contentOverrides);
  const hiddenItems = parseHiddenItems(document.hiddenItems);
  const personalInfo = parsePersonalInfo(document.personalInfo);

  // 1. Parse master CV arrays
  let experiences = parseJsonArray<MasterCvExperience>(masterCv.experiences);
  let skills = parseJsonArray<MasterCvSkill>(masterCv.skills);
  let education = parseJsonArray<MasterCvEducation>(masterCv.education);
  let projects = parseJsonArray<MasterCvProject>(masterCv.projects);
  let languages = parseJsonArray<MasterCvLanguage>(masterCv.languages);
  let certifications = parseJsonArray<MasterCvCertification>(
    masterCv.certifications,
  );

  // 2. Filter hidden items
  for (const section of MASTER_CV_SECTIONS) {
    const hiddenIds = hiddenItems[section as MasterCvSection];
    switch (section) {
      case "experiences":
        experiences = filterHiddenItems(experiences, hiddenIds);
        break;
      case "skills":
        skills = filterHiddenItems(skills, hiddenIds);
        break;
      case "education":
        education = filterHiddenItems(education, hiddenIds);
        break;
      case "projects":
        projects = filterHiddenItems(projects, hiddenIds);
        break;
      case "languages":
        languages = filterHiddenItems(languages, hiddenIds);
        break;
      case "certifications":
        certifications = filterHiddenItems(certifications, hiddenIds);
        break;
    }
  }

  // 3. Apply content overrides
  experiences = applyOverrides(experiences, contentOverrides.experiences);
  skills = applyOverrides(skills, contentOverrides.skills);
  education = applyOverrides(education, contentOverrides.education);
  projects = applyOverrides(projects, contentOverrides.projects);
  languages = applyOverrides(languages, contentOverrides.languages);
  certifications = applyOverrides(
    certifications,
    contentOverrides.certifications,
  );

  // 4. Apply personal info overrides
  const hobbies = parseStringArray(masterCv.hobbies);
  const driverLicenses = parseStringArray(masterCv.driverLicenses);
  const masterSocialLinks = parseSocialLinks(masterCv.socialLinks);

  return {
    fullName: personalInfo.fullName ?? masterCv.fullName,
    headline: personalInfo.headline ?? masterCv.headline,
    summary: personalInfo.summary ?? masterCv.summary,
    email: personalInfo.email ?? masterCv.email,
    phone: personalInfo.phone ?? masterCv.phone,
    city: personalInfo.city ?? masterCv.city,
    photoUrl: personalInfo.photoUrl ?? masterCv.photoUrl,
    hobbies: personalInfo.hobbies ?? hobbies,
    driverLicenses: personalInfo.driverLicenses ?? driverLicenses,
    socialLinks: personalInfo.socialLinks ?? masterSocialLinks,
    experiences,
    skills,
    education,
    projects,
    languages,
    certifications,
  };
}

export function resolveMasterCvContent(
  masterCv: MasterCvData,
): ResolvedCvContent {
  const experiences = parseJsonArray<MasterCvExperience>(masterCv.experiences);
  const skills = parseJsonArray<MasterCvSkill>(masterCv.skills);
  const education = parseJsonArray<MasterCvEducation>(masterCv.education);
  const projects = parseJsonArray<MasterCvProject>(masterCv.projects);
  const languages = parseJsonArray<MasterCvLanguage>(masterCv.languages);
  const certifications = parseJsonArray<MasterCvCertification>(
    masterCv.certifications,
  );

  const hobbies = parseStringArray(masterCv.hobbies);
  const driverLicenses = parseStringArray(masterCv.driverLicenses);
  const socialLinks = parseSocialLinks(masterCv.socialLinks);

  return {
    fullName: masterCv.fullName,
    headline: masterCv.headline,
    summary: masterCv.summary,
    email: masterCv.email,
    phone: masterCv.phone,
    city: masterCv.city,
    photoUrl: masterCv.photoUrl,
    hobbies,
    driverLicenses,
    socialLinks,
    experiences,
    skills,
    education,
    projects,
    languages,
    certifications,
  };
}

// --- Fallback resolver for legacy documents (without masterCvId) ---

type ProfileData = {
  name: string;
  headline: string;
  bio: string | null;
  experiences: Prisma.JsonValue;
  skills: Prisma.JsonValue;
  education: Prisma.JsonValue;
  projects: Prisma.JsonValue;
  languages: Prisma.JsonValue;
  certifications: Prisma.JsonValue;
};

export function resolveCvContentFromProfile(
  profile: ProfileData,
  document: DocumentOverrides,
): ResolvedCvContent {
  const personalInfo = parsePersonalInfo(document.personalInfo);

  const experiences = parseJsonArray<MasterCvExperience>(profile.experiences);
  const skills = parseJsonArray<MasterCvSkill>(profile.skills);
  const education = parseJsonArray<MasterCvEducation>(profile.education);
  const projects = parseJsonArray<MasterCvProject>(profile.projects);
  const languages = parseJsonArray<MasterCvLanguage>(profile.languages);
  const certifications = parseJsonArray<MasterCvCertification>(
    profile.certifications,
  );

  return {
    fullName: personalInfo.fullName ?? profile.name,
    headline: personalInfo.headline ?? profile.headline,
    summary: personalInfo.summary ?? profile.bio,
    email: personalInfo.email ?? null,
    phone: personalInfo.phone ?? null,
    city: personalInfo.city ?? null,
    photoUrl: personalInfo.photoUrl ?? null,
    hobbies: personalInfo.hobbies ?? [],
    driverLicenses: personalInfo.driverLicenses ?? [],
    socialLinks: personalInfo.socialLinks ?? {},
    experiences,
    skills,
    education,
    projects,
    languages,
    certifications,
  };
}
