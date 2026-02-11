import { z } from "zod";

export const interactionTypeSchema = z.enum([
  "EMAIL",
  "CALL",
  "MEETING",
  "LINKEDIN",
  "MESSAGE",
  "OTHER",
]);

export const createContactSchema = z.object({
  firstName: z.string().min(1, "Le prénom est requis"),
  lastName: z.string().min(1, "Le nom est requis"),
  company: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  linkedinUrl: z.string().url().optional().or(z.literal("")),
  role: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

export const updateContactSchema = z.object({
  id: z.string(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  company: z.string().nullable().optional(),
  email: z.string().email().optional().or(z.literal("")).nullable(),
  phone: z.string().nullable().optional(),
  linkedinUrl: z.string().url().optional().or(z.literal("")).nullable(),
  role: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
});

export const addInteractionSchema = z.object({
  contactId: z.string(),
  type: interactionTypeSchema,
  description: z.string().min(1, "La description est requise"),
  date: z.coerce.date(),
});

export const contactFilterSchema = z.object({
  search: z.string().optional(),
  tag: z.string().optional(),
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(20),
  sortBy: z.enum(["createdAt", "firstName", "lastName"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type CreateContactInput = z.infer<typeof createContactSchema>;
export type UpdateContactInput = z.infer<typeof updateContactSchema>;
export type AddInteractionInput = z.infer<typeof addInteractionSchema>;
export type ContactFilter = z.infer<typeof contactFilterSchema>;
