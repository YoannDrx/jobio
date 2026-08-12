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
    BETTER_AUTH_SECRET: z.string().min(32).optional(),
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
    OPPORTUNITY_INBOUND_DOMAIN: z
      .string()
      .regex(/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i)
      .optional(),
    FRANCE_TRAVAIL_CLIENT_ID: z.string().optional(),
    FRANCE_TRAVAIL_CLIENT_SECRET: z.string().optional(),
    FRANCE_TRAVAIL_API_URL: z.string().url().optional(),
    FRANCE_TRAVAIL_TOKEN_URL: z.string().url().optional(),
    ADZUNA_APP_ID: z.string().optional(),
    ADZUNA_APP_KEY: z.string().optional(),
    ADZUNA_LICENSE_APPROVED_AT: z.string().datetime().optional(),
    JOOBLE_API_KEY: z.string().optional(),
    JOOBLE_LICENSE_APPROVED_AT: z.string().datetime().optional(),
    REDIS_URL: z.string().url(),
    STRIPE_PRO_PLAN_ID: z.string().optional(),
    STRIPE_PRO_YEARLY_PLAN_ID: z.string().optional(),
    STRIPE_JOBIO_PORTAL_CONFIGURATION_ID: z.string().optional(),
    CI: z
      .preprocess(
        (value) =>
          value === true ||
          (typeof value === "string" && value.toLowerCase() === "true"),
        z.boolean(),
      )
      .optional(),
    STRIPE_PROGRAM_ATTIRER_PRICE_ID: z.string().optional(),
    STRIPE_PROGRAM_BRANDING_PRICE_ID: z.string().optional(),
    STRIPE_PROGRAM_CROISSANCE_PRICE_ID: z.string().optional(),
    CRON_SECRET: z.string().min(24).optional(),
    LEGAL_BUSINESS_NAME: z.string().optional(),
    LEGAL_FORM: z.string().optional(),
    LEGAL_SIRET: z.string().optional(),
    LEGAL_ADDRESS: z.string().optional(),
    LEGAL_VAT_NOTICE: z.string().optional(),
    LEGAL_REVIEW_APPROVED_AT: z.string().datetime().optional(),
    PRIVACY_REVIEW_APPROVED_AT: z.string().datetime().optional(),
    ACCOUNTING_REVIEW_APPROVED_AT: z.string().datetime().optional(),
    SECURITY_REVIEW_APPROVED_AT: z.string().datetime().optional(),
    PITR_RESTORE_VERIFIED_AT: z.string().datetime().optional(),
    STRIPE_LIVE_SMOKE_VERIFIED_AT: z.string().datetime().optional(),
    MULTI_BROWSER_E2E_VERIFIED_AT: z.string().datetime().optional(),
    WEBHOOK_BACKLOG_VERIFIED_AT: z.string().datetime().optional(),
    PITR_RETENTION_HOURS: z.coerce.number().int().positive().optional(),
    MOBILE_LIGHTHOUSE_SCORE: z.coerce.number().int().min(0).max(100).optional(),
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
