import { z } from "zod";

export const sequenceStepSchema = z.object({
  delayDays: z.number().int().min(1, "Le délai doit être au minimum 1 jour"),
  type: z.enum(["EMAIL", "CALL", "MESSAGE", "MEETING"]),
  templateId: z.string().optional(),
  subject: z.string().optional(),
  title: z.string().min(1, "Le titre est requis"),
});

export const createSequenceSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  description: z.string().optional(),
  steps: z.array(sequenceStepSchema).min(1, "Au moins une étape est requise"),
});

export const updateSequenceSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Le nom est requis").optional(),
  description: z.string().optional(),
  steps: z.array(sequenceStepSchema).optional(),
});

export const deleteSequenceSchema = z.object({
  id: z.string(),
});

export type SequenceStep = z.infer<typeof sequenceStepSchema>;
export type CreateSequenceInput = z.infer<typeof createSequenceSchema>;
export type UpdateSequenceInput = z.infer<typeof updateSequenceSchema>;
