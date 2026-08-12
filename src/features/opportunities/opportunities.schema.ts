import { safePublicHttpsUrlSchema } from "@/lib/security/public-url";
import { z } from "zod";

export const OPPORTUNITY_SOURCES = [
  "FRANCE_TRAVAIL",
  "ADZUNA",
  "JOOBLE",
  "INBOUND_EMAIL",
  "MANUAL",
] as const;

export const AUTOMATED_OPPORTUNITY_SOURCES = [
  "FRANCE_TRAVAIL",
  "ADZUNA",
  "JOOBLE",
] as const;

export const OPPORTUNITY_MATCH_STATUSES = [
  "NEW",
  "SAVED",
  "DISMISSED",
  "CONVERTED",
  "EXPIRED",
] as const;

export const opportunitySourceSchema = z.enum(OPPORTUNITY_SOURCES);
export const opportunityMatchStatusSchema = z.enum(OPPORTUNITY_MATCH_STATUSES);

export const opportunityCriteriaSchema = z.object({
  titles: z.array(z.string().trim().min(2).max(80)).min(1).max(10),
  skills: z.array(z.string().trim().min(1).max(50)).max(30).default([]),
  location: z.string().trim().max(100).optional(),
  workTypes: z
    .array(z.enum(["REMOTE", "HYBRID", "ONSITE"]))
    .max(3)
    .default([]),
  minDailyRate: z.number().int().positive().max(10_000).optional(),
  minSalary: z.number().int().positive().max(1_000_000).optional(),
  duration: z.string().trim().max(80).optional(),
  excludedKeywords: z
    .array(z.string().trim().min(2).max(80))
    .max(30)
    .default([]),
});

export const createOpportunityWatchSchema = z.object({
  name: z.string().trim().min(2).max(80),
  criteria: opportunityCriteriaSchema,
  sources: z
    .array(z.enum(AUTOMATED_OPPORTUNITY_SOURCES))
    .min(1)
    .max(AUTOMATED_OPPORTUNITY_SOURCES.length),
});

export const updateOpportunityWatchSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(2).max(80).optional(),
  criteria: opportunityCriteriaSchema.optional(),
  sources: z
    .array(z.enum(AUTOMATED_OPPORTUNITY_SOURCES))
    .min(1)
    .max(AUTOMATED_OPPORTUNITY_SOURCES.length)
    .optional(),
  isActive: z.boolean().optional(),
});

export const manualOpportunitySchema = z.object({
  content: z.string().trim().min(30).max(50_000),
  sourceUrl: safePublicHttpsUrlSchema.optional(),
});

export const normalizedOpportunitySchema = z.object({
  source: opportunitySourceSchema,
  externalIdentifier: z.string().min(1).max(300),
  canonicalUrl: safePublicHttpsUrlSchema.nullable(),
  title: z.string().trim().min(1).max(300),
  company: z.string().trim().max(200).nullable(),
  description: z.string().trim().max(50_000).nullable(),
  location: z.string().trim().max(200).nullable(),
  workType: z.enum(["REMOTE", "HYBRID", "ONSITE"]).nullable(),
  skills: z.array(z.string().trim().min(1).max(80)).max(100),
  dailyRateMin: z.number().int().nonnegative().nullable(),
  dailyRateMax: z.number().int().nonnegative().nullable(),
  salaryMin: z.number().int().nonnegative().nullable(),
  salaryMax: z.number().int().nonnegative().nullable(),
  currency: z.string().trim().length(3).default("EUR"),
  duration: z.string().trim().max(100).nullable(),
  publishedAt: z.date().nullable(),
  expiresAt: z.date().nullable(),
  provenance: z.record(z.string(), z.unknown()),
});

export const opportunityProviderPageSchema = z.object({
  items: z.array(normalizedOpportunitySchema).max(100),
  nextCursor: z.string().nullable(),
});

export const opportunityMatchFilterSchema = z.object({
  status: opportunityMatchStatusSchema.optional(),
  minScore: z.number().int().min(0).max(100).default(0),
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(30),
});

export const updateOpportunityMatchStatusSchema = z.object({
  id: z.string(),
  status: z.enum(["NEW", "SAVED", "DISMISSED"]),
  feedback: z.string().trim().max(500).optional(),
});

export type OpportunityCriteria = z.infer<typeof opportunityCriteriaSchema>;
export type NormalizedOpportunity = z.infer<typeof normalizedOpportunitySchema>;
export type OpportunitySourceValue = z.infer<typeof opportunitySourceSchema>;
export type OpportunityMatchStatusValue = z.infer<
  typeof opportunityMatchStatusSchema
>;
