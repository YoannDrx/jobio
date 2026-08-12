import { z } from "zod";

export const ContactSupportSchema = z.object({
  firstname: z.string().trim().max(80).optional(),
  lastname: z.string().trim().max(80).optional(),
  email: z.email().max(254),
  subject: z
    .string()
    .trim()
    .min(3)
    .max(160)
    .refine((value) => !/[\r\n]/.test(value)),
  message: z.string().trim().min(10).max(5000),
});

export type ContactSupportSchemaType = z.infer<typeof ContactSupportSchema>;
