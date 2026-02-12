import { z } from "zod";

export const createCompanySchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  website: z.string().url().optional().or(z.literal("")),
  notes: z.string().optional(),
  sector: z.string().optional(),
  size: z.enum(["STARTUP", "PME", "ETI", "GRAND_GROUPE"]).optional(),
  status: z
    .enum(["A_DEMARCHER", "CONTACTE", "EN_DISCUSSION", "REFUSE"])
    .optional(),
  contactId: z.string().optional(),
});

export const updateCompanySchema = z.object({
  id: z.string(),
  name: z.string().min(1).optional(),
  website: z.string().url().optional().or(z.literal("")).nullable(),
  notes: z.string().nullable().optional(),
  sector: z.string().nullable().optional(),
  size: z.enum(["STARTUP", "PME", "ETI", "GRAND_GROUPE"]).nullable().optional(),
  status: z
    .enum(["A_DEMARCHER", "CONTACTE", "EN_DISCUSSION", "REFUSE"])
    .optional(),
  contactId: z.string().nullable().optional(),
});

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;
