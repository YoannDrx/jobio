import { adzunaProvider } from "./adzuna";
import { franceTravailProvider } from "./france-travail";
import { joobleProvider } from "./jooble";
import type { OpportunityProvider } from "./types";

export const opportunityProviders: OpportunityProvider[] = [
  franceTravailProvider,
  adzunaProvider,
  joobleProvider,
];
