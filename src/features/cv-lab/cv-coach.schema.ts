import { z } from "zod";

const text120 = z.string().trim().max(120).default("");
const text200 = z.string().trim().max(200).default("");
const text400 = z.string().trim().max(400).default("");
const text800 = z.string().trim().max(800).default("");
const text1200 = z.string().trim().max(1200).default("");
const text2000 = z.string().trim().max(2000).default("");

export const cvCoachIdentitySchema = z.object({
  fullName: text120,
  headline: text200,
  targetRole: text200,
  location: text120,
  email: text120,
  phone: text120,
  website: text200,
  linkedinUrl: text200,
});

export const CV_COACH_CONFIDENCE_LEVELS = ["HIGH", "MEDIUM", "LOW"] as const;

export const cvCoachExperienceSchema = z.object({
  title: text200,
  company: text200,
  location: text120,
  startDate: text120,
  endDate: text120,
  description: text2000,
  achievements: z.array(text400).max(8).default([]),
  techStack: z.array(text120).max(20).default([]),
  confidence: z.enum(CV_COACH_CONFIDENCE_LEVELS).optional(),
});

export const cvCoachEducationSchema = z.object({
  degree: text200,
  school: text200,
  field: text200,
  location: text120,
  startDate: text120,
  endDate: text120,
  description: text800,
  confidence: z.enum(CV_COACH_CONFIDENCE_LEVELS).optional(),
});

export const cvCoachCertificationSchema = z.object({
  name: text200,
  issuer: text200,
  issueDate: text120,
  expirationDate: text120,
  confidence: z.enum(CV_COACH_CONFIDENCE_LEVELS).optional(),
});

export const cvCoachLanguageSchema = z.object({
  name: text120,
  level: text120,
});

export const cvCoachProjectSchema = z.object({
  name: text200,
  role: text200,
  startDate: text120,
  endDate: text120,
  description: text1200,
  impact: text800,
  url: text200,
  techStack: z.array(text120).max(20).default([]),
  confidence: z.enum(CV_COACH_CONFIDENCE_LEVELS).optional(),
});

export const cvCoachSnapshotSchema = z.object({
  identity: cvCoachIdentitySchema.default({
    fullName: "",
    headline: "",
    targetRole: "",
    location: "",
    email: "",
    phone: "",
    website: "",
    linkedinUrl: "",
  }),
  summary: text2000,
  experiences: z.array(cvCoachExperienceSchema).max(40).default([]),
  education: z.array(cvCoachEducationSchema).max(20).default([]),
  certifications: z.array(cvCoachCertificationSchema).max(20).default([]),
  languages: z.array(cvCoachLanguageSchema).max(15).default([]),
  projects: z.array(cvCoachProjectSchema).max(30).default([]),
  skills: z
    .object({
      hard: z.array(text120).max(60).default([]),
      soft: z.array(text120).max(40).default([]),
      tools: z.array(text120).max(40).default([]),
    })
    .default({ hard: [], soft: [], tools: [] }),
  achievements: z.array(text400).max(30).default([]),
  interests: z.array(text120).max(20).default([]),
  constraints: z
    .object({
      availability: text120,
      tjmTarget: text120,
      salaryTarget: text120,
      contractType: text120,
      workMode: text120,
      mobility: text120,
    })
    .default({
      availability: "",
      tjmTarget: "",
      salaryTarget: "",
      contractType: "",
      workMode: "",
      mobility: "",
    }),
});

export const CV_COACH_MISSING_PRIORITIES = ["HIGH", "MEDIUM", "LOW"] as const;
export const CV_COACH_INCONSISTENCY_SEVERITIES = [
  "CRITICAL",
  "MAJOR",
  "MINOR",
] as const;

export const cvCoachMissingItemSchema = z.object({
  key: z.string().trim().min(1).max(120),
  label: z.string().trim().min(1).max(160),
  reason: z.string().trim().min(1).max(260),
  question: z.string().trim().min(1).max(300),
  priority: z.enum(CV_COACH_MISSING_PRIORITIES),
});

export const cvCoachInconsistencySchema = z.object({
  id: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(300),
  severity: z.enum(CV_COACH_INCONSISTENCY_SEVERITIES),
  suggestion: z.string().trim().min(1).max(260),
});

export const cvCoachSourceEvidenceItemSchema = z.object({
  fieldPath: z.string().trim().min(1).max(200),
  messageIndex: z.number().int().min(0),
  excerpt: text400,
  confidence: z.enum(CV_COACH_CONFIDENCE_LEVELS),
});

export const lockedFieldsSchema = z
  .array(z.string().max(200))
  .max(500)
  .default([]);

export const cvCoachAssistantOutputSchema = z.object({
  assistantMessage: z.string().trim().min(1).max(5000),
  sessionName: z.string().trim().min(2).max(80).optional(),
  completenessScore: z.number().int().min(0).max(100),
  snapshot: cvCoachSnapshotSchema,
  missingItems: z.array(cvCoachMissingItemSchema).max(24).default([]),
  inconsistencies: z.array(cvCoachInconsistencySchema).max(24).default([]),
  nextQuestions: z.array(z.string().trim().min(1).max(300)).max(6).default([]),
  sourceEvidence: z.array(cvCoachSourceEvidenceItemSchema).max(200).default([]),
});

export const cvCoachSessionIdSchema = z.object({
  sessionId: z.string().min(1),
});

export const listCvCoachSessionsSchema = z.object({
  includeArchived: z.boolean().optional(),
});

export const createCvCoachSessionSchema = z.object({
  profileId: z.string().min(1).optional().nullable(),
  goalRole: z.string().trim().max(140).optional().nullable(),
  name: z.string().trim().min(2).max(80).optional(),
});

export const sendCvCoachMessageSchema = z.object({
  sessionId: z.string().min(1),
  message: z.string().trim().min(1).max(5000),
});

export const updateCvCoachSnapshotSchema = z.object({
  sessionId: z.string().min(1),
  snapshot: cvCoachSnapshotSchema,
  completenessScore: z.number().int().min(0).max(100).optional(),
  missingItems: z.array(cvCoachMissingItemSchema).optional(),
  inconsistencies: z.array(cvCoachInconsistencySchema).optional(),
  nextQuestions: z.array(z.string().trim().min(1).max(300)).max(6).optional(),
});

export const applyCvCoachToProfileSchema = z.object({
  sessionId: z.string().min(1),
  profileId: z.string().min(1),
  mode: z.enum(["MERGE", "REPLACE"]).default("MERGE"),
});

export const importCvCoachDocumentSchema = z.object({
  sessionId: z.string().min(1),
  text: z.string().trim().min(1).max(50000),
});

export const updateCvCoachLockedFieldsSchema = z.object({
  sessionId: z.string().min(1),
  lockedFields: z.array(z.string().max(200)).max(500),
});

export type CvCoachSnapshot = z.infer<typeof cvCoachSnapshotSchema>;
export type CvCoachMissingItem = z.infer<typeof cvCoachMissingItemSchema>;
export type CvCoachInconsistency = z.infer<typeof cvCoachInconsistencySchema>;
export type CvCoachAssistantOutput = z.infer<
  typeof cvCoachAssistantOutputSchema
>;
export type CvCoachConfidenceLevel =
  (typeof CV_COACH_CONFIDENCE_LEVELS)[number];
export type CvCoachSourceEvidenceItem = z.infer<
  typeof cvCoachSourceEvidenceItemSchema
>;
