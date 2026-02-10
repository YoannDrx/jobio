import { z } from "zod";

export const missionStatusSchema = z.enum([
  "A_POSTULER",
  "POSTULE",
  "ENTRETIEN",
  "PROPOSITION",
  "ACCEPTE",
  "REFUSE",
  "EN_PAUSE",
  "ABANDONNE",
  "ARCHIVE",
]);

export const missionPrioritySchema = z.enum([
  "LOW",
  "MEDIUM",
  "HIGH",
  "URGENT",
]);

export const workTypeSchema = z.enum(["REMOTE", "HYBRID", "ONSITE"]);

export const createMissionSchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  company: z.string().optional(),
  description: z.string().optional(),
  status: missionStatusSchema.default("A_POSTULER"),
  priority: missionPrioritySchema.default("MEDIUM"),
  tjm: z.number().int().positive().optional(),
  duration: z.string().optional(),
  workType: workTypeSchema.optional(),
  location: z.string().optional(),
  stack: z.array(z.string()).default([]),
  sourceUrl: z.string().url().optional().or(z.literal("")),
  score: z.number().int().min(0).max(100).default(0),
  notes: z.string().optional(),
  platformId: z.string().optional(),
  contactId: z.string().optional(),
  profileId: z.string().optional(),
});

export const updateMissionSchema = z.object({
  id: z.string(),
  title: z.string().min(1).optional(),
  company: z.string().optional(),
  description: z.string().optional(),
  status: missionStatusSchema.optional(),
  priority: missionPrioritySchema.optional(),
  tjm: z.number().int().positive().nullable().optional(),
  duration: z.string().nullable().optional(),
  workType: workTypeSchema.nullable().optional(),
  location: z.string().nullable().optional(),
  stack: z.array(z.string()).optional(),
  sourceUrl: z.string().url().optional().or(z.literal("")).optional(),
  score: z.number().int().min(0).max(100).optional(),
  notes: z.string().nullable().optional(),
  platformId: z.string().nullable().optional(),
  contactId: z.string().nullable().optional(),
  profileId: z.string().nullable().optional(),
});

export const updateMissionStatusSchema = z.object({
  id: z.string(),
  status: missionStatusSchema,
});

export const missionFilterSchema = z.object({
  status: z.array(missionStatusSchema).optional(),
  priority: z.array(missionPrioritySchema).optional(),
  search: z.string().optional(),
  platformId: z.string().optional(),
  tjmMin: z.number().optional(),
  tjmMax: z.number().optional(),
  sortBy: z
    .enum(["createdAt", "updatedAt", "tjm", "score", "title"])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(50),
});

export type CreateMissionInput = z.infer<typeof createMissionSchema>;
export type UpdateMissionInput = z.infer<typeof updateMissionSchema>;
export type MissionFilter = z.infer<typeof missionFilterSchema>;
