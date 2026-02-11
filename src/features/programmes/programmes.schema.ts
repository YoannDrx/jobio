import { z } from "zod";

export const getProgramDetailSchema = z.object({
  slug: z.string().min(1),
});

export const unlockFreeProgramSchema = z.object({
  programId: z.string().min(1),
});

export const createProgramCheckoutSchema = z.object({
  programId: z.string().min(1),
  successUrl: z.string().min(1),
  cancelUrl: z.string().min(1),
});

export const getLinkedInTemplateSchema = z.object({
  templateId: z.string().min(1),
});

export const verifyProgramPurchaseSchema = z.object({
  sessionId: z.string().min(1),
});
