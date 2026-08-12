"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { z } from "zod";

const searchCompanyInputSchema = z.object({
  query: z.string().trim().min(2),
});

type CompanySearchResult = {
  siren: string;
  siret: string | null;
  displayName: string;
  legalName: string | null;
  vatNumber: string | null;
  addressLine1: string;
  addressLine2: string | null;
  postalCode: string;
  city: string;
  countryCode: string;
};

const cleanText = (value: unknown) => {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
};

const toAddressLine1 = (siege: Record<string, unknown>) => {
  const number = cleanText(siege.numero_voie);
  const type = cleanText(siege.type_voie);
  const label = cleanText(siege.libelle_voie);

  return [number, type, label].filter(Boolean).join(" ").trim();
};

export const searchBillingCompaniesAction = authAction
  .inputSchema(searchCompanyInputSchema)
  .action(async ({ parsedInput }) => {
    const response = await fetch(
      `https://recherche-entreprises.api.gouv.fr/search?q=${encodeURIComponent(parsedInput.query)}&per_page=8`,
      {
        cache: "no-store",
      },
    );

    if (!response.ok) {
      return {
        companies: [] as CompanySearchResult[],
      };
    }

    const payload = (await response.json()) as {
      results?: Record<string, unknown>[];
    };

    const companies: CompanySearchResult[] = (payload.results ?? []).map(
      (item) => {
        const siege =
          typeof item.siege === "object" && item.siege !== null
            ? (item.siege as Record<string, unknown>)
            : {};

        const displayName =
          cleanText(item.nom_complet) || cleanText(item.nom_raison_sociale);
        const legalName = cleanText(item.nom_raison_sociale);
        const city =
          cleanText(siege.libelle_commune) || cleanText(siege.commune);

        return {
          siren: cleanText(item.siren),
          siret: cleanText(siege.siret) || null,
          displayName,
          legalName: legalName || null,
          vatNumber: null,
          addressLine1: toAddressLine1(siege),
          addressLine2: cleanText(siege.complement_adresse) || null,
          postalCode: cleanText(siege.code_postal),
          city,
          countryCode: "FR",
        };
      },
    );

    return {
      companies: companies.filter((company) => company.displayName.length > 0),
    };
  });
