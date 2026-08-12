import type {
  NormalizedOpportunity,
  OpportunityCriteria,
  OpportunitySourceValue,
} from "../opportunities.schema";

export type OpportunityProviderPage = {
  items: NormalizedOpportunity[];
  nextCursor: string | null;
};

export type OpportunityProvider = {
  source: OpportunitySourceValue;
  isConfigured: () => boolean;
  search: (
    criteria: OpportunityCriteria,
    cursor: string | null,
  ) => Promise<OpportunityProviderPage>;
};
