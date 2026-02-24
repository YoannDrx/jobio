import { z } from "zod";

export const CV_LAB_TEMPLATES = [
  "CLASSIC",
  "TWO_COLUMN",
  "EXECUTIVE",
  "COMPACT",
] as const;
export const CV_LAB_THEMES = ["MINIMAL", "MODERN", "CONTRAST", "BOLD"] as const;
export const CV_LAB_PAGE_SIZES = ["A4", "LETTER"] as const;
export const CV_LAB_SECTIONS = [
  "summary",
  "experiences",
  "skills",
  "projects",
  "education",
  "languages",
  "certifications",
] as const;

export const cvLabTemplateSchema = z.enum(CV_LAB_TEMPLATES);
export const cvLabThemeSchema = z.enum(CV_LAB_THEMES);
export const cvLabPageSizeSchema = z.enum(CV_LAB_PAGE_SIZES);
export const cvLabSectionSchema = z.enum(CV_LAB_SECTIONS);

const accentColorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/);

const ensureOrderedUniqueSections = (sections: string[]) => {
  const unique = Array.from(new Set(sections));
  const valid = unique.filter((section) =>
    CV_LAB_SECTIONS.includes(section as (typeof CV_LAB_SECTIONS)[number]),
  );

  const remaining = CV_LAB_SECTIONS.filter(
    (section) => !valid.includes(section),
  );
  return [...valid, ...remaining];
};

const sectionOrderSchema = z
  .array(cvLabSectionSchema)
  .default([...CV_LAB_SECTIONS])
  .transform((sections) => ensureOrderedUniqueSections(sections));

const hiddenSectionsSchema = z
  .array(cvLabSectionSchema)
  .default([])
  .transform((sections) => Array.from(new Set(sections)));

// --- Master CV item schemas ---

export const CONTRACT_TYPES = [
  "CDI",
  "CDD",
  "FREELANCE",
  "STAGE",
  "ALTERNANCE",
  "PONCTUEL",
  "HORS_TECH",
] as const;

export const REMOTE_MODES = ["ONSITE", "HYBRID", "REMOTE"] as const;

export const contractTypeSchema = z.enum(CONTRACT_TYPES);
export const remoteModeSchema = z.enum(REMOTE_MODES);

export const masterCvExperienceSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  company: z.string().min(1),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  description: z.string().optional(),
  current: z.boolean().optional(),
  location: z.string().optional(),
  contractType: contractTypeSchema.optional(),
  remote: remoteModeSchema.optional(),
  techStack: z.array(z.string()).optional(),
  achievements: z.array(z.string()).optional(),
  teamContext: z.string().optional(),
});

export const masterCvSkillSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  level: z.string().optional(),
});

export const masterCvEducationSchema = z.object({
  id: z.string(),
  institution: z.string().min(1),
  degree: z.string().min(1),
  field: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  description: z.string().optional(),
});

export const masterCvProjectSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  url: z.string().optional(),
  technologies: z.array(z.string()).optional(),
  role: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  highlights: z.array(z.string()).optional(),
  status: z.string().optional(),
});

export const masterCvLanguageSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  level: z.string().min(1),
});

export const masterCvCertificationSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  issuer: z.string().optional(),
  date: z.string().optional(),
  url: z.string().optional(),
});

export const socialLinksSchema = z.object({
  linkedinUrl: z.string().optional(),
  githubUrl: z.string().optional(),
  websiteUrl: z.string().optional(),
  maltUrl: z.string().optional(),
});

export const masterCvPersonalInfoSchema = z.object({
  fullName: z.string().min(1),
  headline: z.string().optional(),
  summary: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  city: z.string().optional(),
  photoUrl: z.string().optional(),
  hobbies: z.array(z.string()).default([]),
  driverLicenses: z.array(z.string()).default([]),
  socialLinks: socialLinksSchema.optional(),
});

export const MASTER_CV_SECTIONS = [
  "experiences",
  "skills",
  "education",
  "projects",
  "languages",
  "certifications",
] as const;

export const masterCvSectionSchema = z.enum(MASTER_CV_SECTIONS);

export const contentOverrideItemSchema = z.object({
  masterItemId: z.string(),
  title: z.string().optional(),
  company: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  current: z.boolean().optional(),
  description: z.string().optional(),
  name: z.string().optional(),
  level: z.string().optional(),
  institution: z.string().optional(),
  degree: z.string().optional(),
  field: z.string().optional(),
  url: z.string().optional(),
  issuer: z.string().optional(),
  date: z.string().optional(),
  technologies: z.array(z.string()).optional(),
  // Experience enrichment fields
  location: z.string().optional(),
  contractType: contractTypeSchema.optional(),
  remote: remoteModeSchema.optional(),
  techStack: z.array(z.string()).optional(),
  achievements: z.array(z.string()).optional(),
  teamContext: z.string().optional(),
  // Project enrichment fields
  role: z.string().optional(),
  highlights: z.array(z.string()).optional(),
  status: z.string().optional(),
});

export const contentOverridesSchema = z.object({
  experiences: z.array(contentOverrideItemSchema).optional(),
  skills: z.array(contentOverrideItemSchema).optional(),
  education: z.array(contentOverrideItemSchema).optional(),
  projects: z.array(contentOverrideItemSchema).optional(),
  languages: z.array(contentOverrideItemSchema).optional(),
  certifications: z.array(contentOverrideItemSchema).optional(),
});

export const hiddenItemsSchema = z.record(
  masterCvSectionSchema,
  z.array(z.string()),
);

export const personalInfoOverridesSchema = z.object({
  fullName: z.string().optional(),
  headline: z.string().optional(),
  summary: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  city: z.string().optional(),
  photoUrl: z.string().optional(),
  hobbies: z.array(z.string()).optional(),
  driverLicenses: z.array(z.string()).optional(),
  socialLinks: socialLinksSchema.optional(),
});

export const cvLabDocumentInputSchema = z.object({
  profileId: z.string().min(1),
  name: z.string().trim().min(2).max(80),
  targetRole: z.string().trim().max(120).optional().nullable(),
  template: cvLabTemplateSchema.default("CLASSIC"),
  theme: cvLabThemeSchema.default("MODERN"),
  pageSize: cvLabPageSizeSchema.default("A4"),
  accentColor: accentColorSchema.default("#0f172a"),
  fontFamily: z.string().trim().min(2).max(40).default("Inter"),
  headlineOverride: z.string().trim().max(180).optional().nullable(),
  summaryOverride: z.string().trim().max(1400).optional().nullable(),
  sectionOrder: sectionOrderSchema,
  hiddenSections: hiddenSectionsSchema,
  masterCvId: z.string().optional().nullable(),
  contentOverrides: contentOverridesSchema.optional().nullable(),
  hiddenItems: hiddenItemsSchema.optional().nullable(),
  personalInfo: personalInfoOverridesSchema.optional().nullable(),
});

export const createCvLabDocumentSchema = cvLabDocumentInputSchema;

export const updateCvLabDocumentSchema = cvLabDocumentInputSchema
  .partial()
  .extend({
    id: z.string().min(1),
  });

export const cvLabDocumentIdSchema = z.object({
  id: z.string().min(1),
});

export const createCvLabVersionSchema = z.object({
  documentId: z.string().min(1),
  label: z.string().trim().min(2).max(60).optional(),
});

export const restoreCvLabVersionSchema = z.object({
  documentId: z.string().min(1),
  versionId: z.string().min(1),
});

export type CvLabTemplate = z.infer<typeof cvLabTemplateSchema>;
export type CvLabTheme = z.infer<typeof cvLabThemeSchema>;
export type CvLabPageSize = z.infer<typeof cvLabPageSizeSchema>;
export type CvLabSection = z.infer<typeof cvLabSectionSchema>;
export type CvLabDocumentInput = z.infer<typeof cvLabDocumentInputSchema>;

export type MasterCvExperience = z.infer<typeof masterCvExperienceSchema>;
export type MasterCvSkill = z.infer<typeof masterCvSkillSchema>;
export type MasterCvEducation = z.infer<typeof masterCvEducationSchema>;
export type MasterCvProject = z.infer<typeof masterCvProjectSchema>;
export type MasterCvLanguage = z.infer<typeof masterCvLanguageSchema>;
export type MasterCvCertification = z.infer<typeof masterCvCertificationSchema>;
export type MasterCvItem =
  | MasterCvExperience
  | MasterCvSkill
  | MasterCvEducation
  | MasterCvProject
  | MasterCvLanguage
  | MasterCvCertification;
export type MasterCvPersonalInfo = z.infer<typeof masterCvPersonalInfoSchema>;
export type MasterCvSection = z.infer<typeof masterCvSectionSchema>;
export type ContentOverrideItem = z.infer<typeof contentOverrideItemSchema>;
export type ContentOverrides = z.infer<typeof contentOverridesSchema>;
export type HiddenItems = z.infer<typeof hiddenItemsSchema>;
export type PersonalInfoOverrides = z.infer<typeof personalInfoOverridesSchema>;
export type SocialLinks = z.infer<typeof socialLinksSchema>;
export type ContractType = z.infer<typeof contractTypeSchema>;
export type RemoteMode = z.infer<typeof remoteModeSchema>;
