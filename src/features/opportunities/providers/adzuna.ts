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
  results: z.array(
    z.object({
      id: z.union([z.string(), z.number()]),
      title: z.string(),
      description: z.string().nullish(),
      redirect_url: z.string().url().nullish(),
      created: z.string().nullish(),
      company: z.object({ display_name: z.string().nullish() }).nullish(),
      location: z.object({ display_name: z.string().nullish() }).nullish(),
      salary_min: z.number().nullish(),
      salary_max: z.number().nullish(),
      contract_time: z.string().nullish(),
      contract_type: z.string().nullish(),
    }),
  ),
});

export const adzunaProvider: OpportunityProvider = {
  source: "ADZUNA",
  isConfigured: () => Boolean(env.ADZUNA_APP_ID && env.ADZUNA_APP_KEY),
  search: async (criteria, cursor) => {
    const pageNumber = Math.max(1, Number.parseInt(cursor ?? "1", 10) || 1);
    const url = new URL(
      `https://api.adzuna.com/v1/api/jobs/fr/search/${pageNumber}`,
    );
    url.searchParams.set("app_id", env.ADZUNA_APP_ID ?? "");
    url.searchParams.set("app_key", env.ADZUNA_APP_KEY ?? "");
    url.searchParams.set("what", criteria.titles.join(" "));
    url.searchParams.set("results_per_page", "50");
    url.searchParams.set("content-type", "application/json");
    if (criteria.location) url.searchParams.set("where", criteria.location);

    const payload = await upfetch(url.toString(), {
      timeout: 15_000,
      retry: { attempts: 2 },
      schema: responseSchema,
    });
    return opportunityProviderPageSchema.parse({
      items: payload.results.map((item) => ({
        source: "ADZUNA",
        externalIdentifier: String(item.id),
        canonicalUrl: canonicalizeOpportunityUrl(item.redirect_url),
        title: item.title,
        company: item.company?.display_name ?? null,
        description: item.description ?? null,
        location: item.location?.display_name ?? null,
        workType: inferOpportunityWorkType(
          item.title,
          item.description,
          item.location?.display_name,
        ),
        skills: [],
        dailyRateMin: null,
        dailyRateMax: null,
        salaryMin: item.salary_min ? Math.round(item.salary_min) : null,
        salaryMax: item.salary_max ? Math.round(item.salary_max) : null,
        currency: "EUR",
        duration: item.contract_time ?? item.contract_type ?? null,
        publishedAt: item.created ? new Date(item.created) : null,
        expiresAt: null,
        provenance: { provider: "Adzuna", country: "fr" },
      })),
      nextCursor: payload.results.length === 50 ? String(pageNumber + 1) : null,
    });
  },
};
