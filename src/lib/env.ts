import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

/**
 * This is the schema for the environment variables.
 *
 * Please import **this** file and use the `env` variable
 */
export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    GITHUB_CLIENT_ID: z.string().optional(),
    GITHUB_CLIENT_SECRET: z.string().optional(),
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    RESEND_API_KEY: z.string().min(1),
    RESEND_AUDIENCE_ID: z.string().optional(),
    EMAIL_FROM: z.string().min(1),
    STRIPE_SECRET_KEY: z.string().min(1),
    NODE_ENV: z.enum(["development", "production", "test"]),
    RESEND_WEBHOOK_SECRET: z.string().optional(),
    STRIPE_WEBHOOK_SECRET: z.string().optional(),
    OPENAI_API_KEY: z.string().min(1),
    REDIS_URL: z.string().url(),
    STRIPE_PRO_PLAN_ID: z.string().optional(),
    STRIPE_PRO_YEARLY_PLAN_ID: z.string().optional(),
    STRIPE_ULTRA_PLAN_ID: z.string().optional(),
    STRIPE_ULTRA_YEARLY_PLAN_ID: z.string().optional(),
    CI: z.coerce.boolean().optional(),
    STRIPE_PROGRAM_ATTIRER_PRICE_ID: z.string().optional(),
    STRIPE_PROGRAM_BRANDING_PRICE_ID: z.string().optional(),
    STRIPE_PROGRAM_CROISSANCE_PRICE_ID: z.string().optional(),
    SEO_SEARCH_METRICS_JSON: z.string().optional(),
    SEO_SEARCH_METRICS_FILE: z.string().optional(),
    SEO_SEARCH_METRICS_ENDPOINT: z.string().url().optional(),
    SEO_SEARCH_METRICS_BEARER_TOKEN: z.string().optional(),
    SEO_SEARCH_METRICS_TIMEOUT_MS: z.coerce
      .number()
      .int()
      .positive()
      .optional(),
  },
  /**
   * If you add `client` environment variables, you need to add them to
   * `experimental__runtimeEnv` as well.
   */
  client: {
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1),
    NEXT_PUBLIC_EMAIL_CONTACT: z.string().min(1),
  },
  experimental__runtimeEnv: {
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_EMAIL_CONTACT: process.env.NEXT_PUBLIC_EMAIL_CONTACT,
  },
});
