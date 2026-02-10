import { z } from "zod";

export const followUpTypeSchema = z.enum([
  "EMAIL",
  "CALL",
  "MESSAGE",
  "MEETING",
]);

export const createFollowUpSchema = z.object({
  missionId: z.string(),
  type: followUpTypeSchema,
  title: z.string().min(1, "Le titre est requis"),
  description: z.string().optional(),
  scheduledAt: z.coerce.date(),
  templateId: z.string().optional(),
});

export const updateFollowUpSchema = z.object({
  id: z.string(),
  type: followUpTypeSchema.optional(),
  title: z.string().min(1, "Le titre est requis").optional(),
  description: z.string().optional(),
  scheduledAt: z.coerce.date().optional(),
  templateId: z.string().nullable().optional(),
});

export const completeFollowUpSchema = z.object({
  id: z.string(),
});

export type CreateFollowUpInput = z.infer<typeof createFollowUpSchema>;
export type UpdateFollowUpInput = z.infer<typeof updateFollowUpSchema>;
