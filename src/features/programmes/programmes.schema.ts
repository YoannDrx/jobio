import { z } from "zod";

const internalPathSchema = z
  .string()
  .startsWith("/")
  .refine((value) => !value.startsWith("//"), "Invalid internal path");

export const getProgramDetailSchema = z.object({
  slug: z.string().min(1),
});

export const unlockFreeProgramSchema = z.object({
  programId: z.string().min(1),
});

export const createProgramCheckoutSchema = z.object({
  programId: z.string().min(1),
  successUrl: internalPathSchema,
  cancelUrl: internalPathSchema,
});

export const getLinkedInTemplateSchema = z.object({
  templateId: z.string().min(1),
});

export const verifyProgramPurchaseSchema = z.object({
  sessionId: z.string().min(1),
});
