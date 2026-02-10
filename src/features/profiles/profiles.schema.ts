import { z } from "zod";

export const skillSchema = z.object({
  name: z.string().min(1, "Le nom de la compétence est requis"),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"], {
    message: "Niveau invalide",
  }),
  yearsExp: z.number().int().nonnegative().optional(),
});

export const createProfileSchema = z.object({
  name: z.string().min(1, "Le nom du profil est requis"),
  headline: z.string().min(1, "Le titre professionnel est requis"),
  bio: z.string().optional(),
  skills: z.array(skillSchema).default([]),
  tjmTarget: z.number().int().positive().optional(),
  workTypePreference: z.enum(["REMOTE", "HYBRID", "ONSITE"]).optional(),
  zone: z.string().optional(),
  minDuration: z.string().optional(),
  maxDuration: z.string().optional(),
  isDefault: z.boolean().default(false),
});

export const updateProfileSchema = z.object({
  id: z.string(),
  name: z.string().min(1).optional(),
  headline: z.string().min(1).optional(),
  bio: z.string().optional(),
  skills: z.array(skillSchema).optional(),
  tjmTarget: z.number().int().positive().nullable().optional(),
  workTypePreference: z
    .enum(["REMOTE", "HYBRID", "ONSITE"])
    .nullable()
    .optional(),
  zone: z.string().nullable().optional(),
  minDuration: z.string().nullable().optional(),
  maxDuration: z.string().nullable().optional(),
  isDefault: z.boolean().optional(),
});

export type CreateProfileInput = z.infer<typeof createProfileSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type Skill = z.infer<typeof skillSchema>;
