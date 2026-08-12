import { env } from "@/lib/env";
import { upfetch } from "@/lib/up-fetch";
import { z } from "zod";
import {
  canonicalizeOpportunityUrl,
  inferOpportunityWorkType,
} from "../opportunity-normalization";
import { opportunityProviderPageSchema } from "../opportunities.schema";
import type { OpportunityProvider } from "./types";

const responseSchema = z.object({
  jobs: z.array(
    z.object({
      id: z.union([z.string(), z.number()]),
      title: z.string(),
      company: z.string().nullish(),
      snippet: z.string().nullish(),
      location: z.string().nullish(),
      salary: z.string().nullish(),
      source: z.string().nullish(),
      link: z.string().url().nullish(),
      updated: z.string().nullish(),
      type: z.string().nullish(),
    }),
  ),
});

export const joobleProvider: OpportunityProvider = {
  source: "JOOBLE",
  isConfigured: () => Boolean(env.JOOBLE_API_KEY),
  search: async (criteria, cursor) => {
    const pageNumber = Math.max(1, Number.parseInt(cursor ?? "1", 10) || 1);
    const payload = await upfetch(
      `https://jooble.org/api/${env.JOOBLE_API_KEY ?? ""}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: {
          keywords: criteria.titles.join(" "),
          location: criteria.location ?? "France",
          page: pageNumber,
          ResultOnPage: 50,
        },
        timeout: 15_000,
        retry: { attempts: 2 },
        schema: responseSchema,
      },
    );
    return opportunityProviderPageSchema.parse({
      items: payload.jobs.map((item) => ({
        source: "JOOBLE",
        externalIdentifier: String(item.id),
        canonicalUrl: canonicalizeOpportunityUrl(item.link),
        title: item.title,
        company: item.company ?? null,
        description: item.snippet ?? null,
        location: item.location ?? null,
        workType: inferOpportunityWorkType(
          item.title,
          item.snippet,
          item.location,
        ),
        skills: [],
        dailyRateMin: null,
        dailyRateMax: null,
        salaryMin: null,
        salaryMax: null,
        currency: "EUR",
        duration: item.type ?? null,
        publishedAt: item.updated ? new Date(item.updated) : null,
        expiresAt: null,
        provenance: { provider: "Jooble", originalSource: item.source ?? null },
      })),
      nextCursor: payload.jobs.length === 50 ? String(pageNumber + 1) : null,
    });
  },
};
