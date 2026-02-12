import { z } from "zod";

export const skillSchema = z.object({
  name: z.string().min(1, "Le nom de la compétence est requis"),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"], {
    message: "Niveau invalide",
  }),
  yearsExp: z.number().int().nonnegative().optional(),
});

export const experienceSchema = z.object({
  title: z.string().min(1, "Le titre du poste est requis"),
  company: z.string().min(1, "Le nom de l'entreprise est requis"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  description: z.string().optional(),
});

export const educationSchema = z.object({
  degree: z.string().min(1, "Le diplôme est requis"),
  school: z.string().min(1, "L'établissement est requis"),
  field: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  description: z.string().optional(),
});

export const certificationSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  issuer: z.string().min(1, "L'organisme est requis"),
  issueDate: z.string().optional(),
});

export const languageSchema = z.object({
  name: z.string().min(1, "La langue est requise"),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "FLUENT"]),
});

export const projectSchema = z.object({
  name: z.string().min(1, "Le nom du projet est requis"),
  description: z.string().optional(),
  url: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const createProfileSchema = z.object({
  name: z.string().min(1, "Le nom du profil est requis"),
  headline: z.string().min(1, "Le titre professionnel est requis"),
  bio: z.string().optional(),
  skills: z.array(skillSchema).default([]),
  experiences: z.array(experienceSchema).default([]),
  education: z.array(educationSchema).default([]),
  certifications: z.array(certificationSchema).default([]),
  languages: z.array(languageSchema).default([]),
  projects: z.array(projectSchema).default([]),
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
  experiences: z.array(experienceSchema).optional(),
  education: z.array(educationSchema).optional(),
  certifications: z.array(certificationSchema).optional(),
  languages: z.array(languageSchema).optional(),
  projects: z.array(projectSchema).optional(),
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
export type Experience = z.infer<typeof experienceSchema>;
export type Education = z.infer<typeof educationSchema>;
export type Certification = z.infer<typeof certificationSchema>;
export type Language = z.infer<typeof languageSchema>;
export type Project = z.infer<typeof projectSchema>;
