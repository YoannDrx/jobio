import { z } from "zod";

export const templateTypeSchema = z.enum([
  "FIRST_CONTACT",
  "FOLLOW_UP_J3",
  "FOLLOW_UP_J7",
  "FOLLOW_UP_J14",
  "POST_INTERVIEW",
  "NEGOTIATION",
  "THANK_YOU",
  "CUSTOM",
]);

export const createTemplateSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  type: templateTypeSchema,
  subject: z.string().optional(),
  body: z.string().min(1, "Le contenu est requis"),
  variables: z.array(z.string()).default([]),
});

export const updateTemplateSchema = z.object({
  id: z.string(),
  name: z.string().min(1).optional(),
  type: templateTypeSchema.optional(),
  subject: z.string().nullable().optional(),
  body: z.string().min(1).optional(),
  variables: z.array(z.string()).optional(),
});

export type TemplateType = z.infer<typeof templateTypeSchema>;
export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;
