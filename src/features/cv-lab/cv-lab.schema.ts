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

  const remaining = CV_LAB_SECTIONS.filter((section) => !valid.includes(section));
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
