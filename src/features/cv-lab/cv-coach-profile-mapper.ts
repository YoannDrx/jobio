import { Prisma } from "@/generated/prisma";
import type { CvCoachSnapshot } from "./cv-coach.schema";

export type ProfileCoachMergeMode = "MERGE" | "REPLACE";

type ProfileLike = {
  headline: string | null;
  bio: string | null;
  skills: unknown;
  experiences: unknown;
  education: unknown;
  certifications: unknown;
  languages: unknown;
  projects: unknown;
  zone: string | null;
};

type SkillLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";
type LanguageLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "FLUENT";

type Skill = { name: string; level: SkillLevel; yearsExp?: number };
type Experience = {
  title: string;
  company: string;
  startDate?: string;
  endDate?: string;
  description?: string;
};
type Education = {
  degree: string;
  school: string;
  field?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
};
type Certification = { name: string; issuer: string; issueDate?: string };
type Language = { name: string; level: LanguageLevel };
type Project = {
  name: string;
  description?: string;
  url?: string;
  startDate?: string;
  endDate?: string;
};

type ProfileUpdatePayload = {
  headline: string;
  bio: string | null;
  skills: Prisma.InputJsonValue | Prisma.NullTypes.JsonNull;
  experiences: Prisma.InputJsonValue | Prisma.NullTypes.JsonNull;
  education: Prisma.InputJsonValue | Prisma.NullTypes.JsonNull;
  certifications: Prisma.InputJsonValue | Prisma.NullTypes.JsonNull;
  languages: Prisma.InputJsonValue | Prisma.NullTypes.JsonNull;
  projects: Prisma.InputJsonValue | Prisma.NullTypes.JsonNull;
  zone: string | null;
};

const asNonEmptyString = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const toJson = (
  value: unknown[],
): Prisma.InputJsonValue | Prisma.NullTypes.JsonNull =>
  value.length > 0 ? (value as Prisma.InputJsonValue) : Prisma.JsonNull;

const dedupeByKey = <T>(items: T[], keyFn: (item: T) => string): T[] => {
  const seen = new Set<string>();
  const output: T[] = [];

  for (const item of items) {
    const key = keyFn(item);
    if (!key || seen.has(key)) {
      continue;
    }
    seen.add(key);
    output.push(item);
  }

  return output;
};

const parseArray = <T>(value: unknown): T[] =>
  Array.isArray(value) ? (value as T[]) : [];

const mapLanguageLevel = (level: string): LanguageLevel => {
  const normalized = level.toLowerCase();

  if (["a1", "a2", "beginner", "elementary", "debutant"].includes(normalized)) {
    return "BEGINNER";
  }
  if (["b1", "b2", "intermediate", "intermediaire"].includes(normalized)) {
    return "INTERMEDIATE";
  }
  if (["c1", "advanced", "avance"].includes(normalized)) {
    return "ADVANCED";
  }
  return "FLUENT";
};

const mapSkills = (snapshot: CvCoachSnapshot): Skill[] => {
  const mergedSkills = [...snapshot.skills.hard, ...snapshot.skills.tools]
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  return dedupeByKey(
    mergedSkills.map((name) => ({ name, level: "ADVANCED" as const })),
    (item) => item.name.toLowerCase(),
  );
};

const mapExperiences = (snapshot: CvCoachSnapshot): Experience[] => {
  const output: Experience[] = [];

  for (const item of snapshot.experiences) {
    const title = item.title.trim();
    const company = item.company.trim();
    if (!title || !company) {
      continue;
    }

    const descriptionChunks = [
      item.description.trim(),
      item.achievements
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => `- ${line}`)
        .join("\n"),
    ].filter(Boolean);

    const mapped: Experience = {
      title,
      company,
    };

    const startDate = item.startDate.trim();
    const endDate = item.endDate.trim();
    const description = descriptionChunks.join("\n").trim();

    if (startDate) mapped.startDate = startDate;
    if (endDate) mapped.endDate = endDate;
    if (description) mapped.description = description;

    output.push(mapped);
  }

  return output;
};

const mapEducation = (snapshot: CvCoachSnapshot): Education[] => {
  const output: Education[] = [];

  for (const item of snapshot.education) {
    const degree = item.degree.trim();
    const school = item.school.trim();
    if (!degree || !school) {
      continue;
    }

    const mapped: Education = {
      degree,
      school,
    };

    const field = item.field.trim();
    const startDate = item.startDate.trim();
    const endDate = item.endDate.trim();
    const description = item.description.trim();

    if (field) mapped.field = field;
    if (startDate) mapped.startDate = startDate;
    if (endDate) mapped.endDate = endDate;
    if (description) mapped.description = description;

    output.push(mapped);
  }

  return output;
};

const mapCertifications = (snapshot: CvCoachSnapshot): Certification[] => {
  const output: Certification[] = [];

  for (const item of snapshot.certifications) {
    const name = item.name.trim();
    const issuer = item.issuer.trim();
    if (!name || !issuer) {
      continue;
    }

    const mapped: Certification = {
      name,
      issuer,
    };
    const issueDate = item.issueDate.trim();
    if (issueDate) mapped.issueDate = issueDate;

    output.push(mapped);
  }

  return output;
};

const mapLanguages = (snapshot: CvCoachSnapshot): Language[] => {
  return snapshot.languages
    .map((item) => {
      const name = item.name.trim();
      if (!name) {
        return null;
      }

      return {
        name,
        level: mapLanguageLevel(item.level.trim() || ""),
      } satisfies Language;
    })
    .filter((item): item is Language => Boolean(item));
};

const mapProjects = (snapshot: CvCoachSnapshot): Project[] => {
  const output: Project[] = [];

  for (const item of snapshot.projects) {
    const name = item.name.trim();
    if (!name) {
      continue;
    }

    const mapped: Project = {
      name,
    };

    const description = [item.description.trim(), item.impact.trim()]
      .filter(Boolean)
      .join("\n")
      .trim();
    const url = item.url.trim();
    const startDate = item.startDate.trim();
    const endDate = item.endDate.trim();

    if (description) mapped.description = description;
    if (url) mapped.url = url;
    if (startDate) mapped.startDate = startDate;
    if (endDate) mapped.endDate = endDate;

    output.push(mapped);
  }

  return output;
};

const mergeSkills = (current: Skill[], incoming: Skill[]) =>
  dedupeByKey([...incoming, ...current], (item) => item.name.toLowerCase());

const mergeExperiences = (current: Experience[], incoming: Experience[]) =>
  dedupeByKey(
    [...incoming, ...current],
    (item) =>
      `${item.title.toLowerCase()}::${item.company.toLowerCase()}::${(item.startDate ?? "").toLowerCase()}`,
  );

const mergeEducation = (current: Education[], incoming: Education[]) =>
  dedupeByKey(
    [...incoming, ...current],
    (item) =>
      `${item.degree.toLowerCase()}::${item.school.toLowerCase()}::${(item.startDate ?? "").toLowerCase()}`,
  );

const mergeCertifications = (
  current: Certification[],
  incoming: Certification[],
) =>
  dedupeByKey(
    [...incoming, ...current],
    (item) => `${item.name.toLowerCase()}::${item.issuer.toLowerCase()}`,
  );

const mergeLanguages = (current: Language[], incoming: Language[]) =>
  dedupeByKey([...incoming, ...current], (item) => item.name.toLowerCase());

const mergeProjects = (current: Project[], incoming: Project[]) =>
  dedupeByKey([...incoming, ...current], (item) => item.name.toLowerCase());

const combineSummary = (current: string, incoming: string) => {
  if (!incoming) return current || null;
  if (!current) return incoming;

  if (current.includes(incoming)) {
    return current;
  }

  return `${incoming}\n\n${current}`.trim();
};

export function buildProfileUpdateFromCvCoach(params: {
  snapshot: CvCoachSnapshot;
  mode: ProfileCoachMergeMode;
  currentProfile: ProfileLike;
}): ProfileUpdatePayload {
  const { snapshot, mode, currentProfile } = params;

  const incomingSkills = mapSkills(snapshot);
  const incomingExperiences = mapExperiences(snapshot);
  const incomingEducation = mapEducation(snapshot);
  const incomingCertifications = mapCertifications(snapshot);
  const incomingLanguages = mapLanguages(snapshot);
  const incomingProjects = mapProjects(snapshot);

  const currentSkills = parseArray<Skill>(currentProfile.skills);
  const currentExperiences = parseArray<Experience>(currentProfile.experiences);
  const currentEducation = parseArray<Education>(currentProfile.education);
  const currentCertifications = parseArray<Certification>(
    currentProfile.certifications,
  );
  const currentLanguages = parseArray<Language>(currentProfile.languages);
  const currentProjects = parseArray<Project>(currentProfile.projects);

  const skills =
    mode === "REPLACE"
      ? incomingSkills
      : mergeSkills(currentSkills, incomingSkills);
  const experiences =
    mode === "REPLACE"
      ? incomingExperiences
      : mergeExperiences(currentExperiences, incomingExperiences);
  const education =
    mode === "REPLACE"
      ? incomingEducation
      : mergeEducation(currentEducation, incomingEducation);
  const certifications =
    mode === "REPLACE"
      ? incomingCertifications
      : mergeCertifications(currentCertifications, incomingCertifications);
  const languages =
    mode === "REPLACE"
      ? incomingLanguages
      : mergeLanguages(currentLanguages, incomingLanguages);
  const projects =
    mode === "REPLACE"
      ? incomingProjects
      : mergeProjects(currentProjects, incomingProjects);

  const incomingHeadline =
    asNonEmptyString(snapshot.identity.headline) ||
    asNonEmptyString(snapshot.identity.targetRole);
  const headline =
    incomingHeadline ||
    asNonEmptyString(currentProfile.headline) ||
    "Freelance";

  const currentSummary = asNonEmptyString(currentProfile.bio);
  const incomingSummary = asNonEmptyString(snapshot.summary);
  const bio =
    mode === "REPLACE"
      ? incomingSummary || null
      : combineSummary(currentSummary, incomingSummary);

  const incomingZone = asNonEmptyString(snapshot.identity.location);
  const zone = incomingZone || currentProfile.zone;

  return {
    headline,
    bio,
    skills: toJson(skills),
    experiences: toJson(experiences),
    education: toJson(education),
    certifications: toJson(certifications),
    languages: toJson(languages),
    projects: toJson(projects),
    zone,
  };
}
