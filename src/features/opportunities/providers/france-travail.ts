import { env } from "@/lib/env";
import { upfetch } from "@/lib/up-fetch";
import { z } from "zod";
import {
  canonicalizeOpportunityUrl,
  inferOpportunityWorkType,
  normalizeSkills,
} from "../opportunity-normalization";
import { opportunityProviderPageSchema } from "../opportunities.schema";
import type { OpportunityProvider } from "./types";

const tokenSchema = z.object({ access_token: z.string().min(1) });
const responseSchema = z.object({
  resultats: z.array(
    z
      .object({
        id: z.string(),
        intitule: z.string(),
        description: z.string().nullish(),
        dateCreation: z.string().nullish(),
        dateActualisation: z.string().nullish(),
        lieuTravail: z.object({ libelle: z.string().nullish() }).nullish(),
        entreprise: z.object({ nom: z.string().nullish() }).nullish(),
        origineOffre: z
          .object({ urlOrigine: z.string().url().nullish() })
          .nullish(),
        competences: z
          .array(z.object({ libelle: z.string().nullish() }))
          .nullish(),
        salaire: z.object({ libelle: z.string().nullish() }).nullish(),
        typeContratLibelle: z.string().nullish(),
      })
      .passthrough(),
  ),
});

const parseInteger = (value: string | null | undefined): number | null => {
  const amount = value?.match(/\d[\d\s]*(?:[.,]\d+)?/)?.[0];
  if (!amount) return null;
  const parsed = Number(amount.replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(parsed) ? Math.round(parsed) : null;
};

const getAccessToken = async (): Promise<string> => {
  const tokenUrl = new URL(
    env.FRANCE_TRAVAIL_TOKEN_URL ??
      "https://entreprise.francetravail.fr/connexion/oauth2/access_token",
  );
  tokenUrl.searchParams.set("realm", "/partenaire");
  const payload = await upfetch(tokenUrl.toString(), {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: env.FRANCE_TRAVAIL_CLIENT_ID ?? "",
      client_secret: env.FRANCE_TRAVAIL_CLIENT_SECRET ?? "",
      scope: "api_offresdemploiv2 o2dsoffre",
    }),
    timeout: 10_000,
    retry: { attempts: 1 },
    schema: tokenSchema,
  });
  return payload.access_token;
};

export const franceTravailProvider: OpportunityProvider = {
  source: "FRANCE_TRAVAIL",
  isConfigured: () =>
    Boolean(env.FRANCE_TRAVAIL_CLIENT_ID && env.FRANCE_TRAVAIL_CLIENT_SECRET),
  search: async (criteria, cursor) => {
    const accessToken = await getAccessToken();
    const rangeStart = Number.parseInt(cursor ?? "0", 10) || 0;
    const rangeEnd = Math.min(rangeStart + 49, 149);
    const searchUrl = new URL(
      `${env.FRANCE_TRAVAIL_API_URL ?? "https://api.francetravail.io/partenaire/offresdemploi/v2"}/offres/search`,
    );
    searchUrl.searchParams.set("motsCles", criteria.titles.join(" "));
    if (/^\d{5}$/.test(criteria.location ?? "")) {
      searchUrl.searchParams.set("commune", criteria.location ?? "");
    } else if (/^\d{2,3}$/.test(criteria.location ?? "")) {
      searchUrl.searchParams.set("departement", criteria.location ?? "");
    }
    searchUrl.searchParams.set("range", `${rangeStart}-${rangeEnd}`);

    const payload = await upfetch(searchUrl.toString(), {
      headers: { authorization: `Bearer ${accessToken}` },
      timeout: 15_000,
      retry: { attempts: 2 },
      schema: responseSchema,
    });

    const page = opportunityProviderPageSchema.parse({
      items: payload.resultats.map((item) => {
        const compensation = parseInteger(item.salaire?.libelle);
        const isDailyRate = /jour|journalier|tjm/i.test(
          item.salaire?.libelle ?? "",
        );
        const canonicalUrl = canonicalizeOpportunityUrl(
          item.origineOffre?.urlOrigine ??
            `https://candidat.francetravail.fr/offres/recherche/detail/${item.id}`,
        );
        return {
          source: "FRANCE_TRAVAIL",
          externalIdentifier: item.id,
          canonicalUrl,
          title: item.intitule,
          company: item.entreprise?.nom ?? null,
          description: item.description ?? null,
          location: item.lieuTravail?.libelle ?? null,
          workType: inferOpportunityWorkType(
            item.intitule,
            item.description,
            item.lieuTravail?.libelle,
          ),
          skills: normalizeSkills(
            item.competences?.flatMap((skill) =>
              skill.libelle ? [skill.libelle] : [],
            ) ?? [],
          ),
          dailyRateMin: isDailyRate ? compensation : null,
          dailyRateMax: isDailyRate ? compensation : null,
          salaryMin: isDailyRate ? null : compensation,
          salaryMax: isDailyRate ? null : compensation,
          currency: "EUR",
          duration: item.typeContratLibelle ?? null,
          publishedAt: item.dateCreation ? new Date(item.dateCreation) : null,
          expiresAt: null,
          provenance: {
            provider: "France Travail",
            lastUpdatedAt: item.dateActualisation ?? null,
          },
        };
      }),
      nextCursor:
        payload.resultats.length === 50 && rangeEnd < 149
          ? String(rangeStart + 50)
          : null,
    });
    return page;
  },
};
