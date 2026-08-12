import { scoreOpportunity } from "@/features/opportunities/opportunity-scoring";
import {
  normalizedOpportunitySchema,
  opportunityCriteriaSchema,
} from "@/features/opportunities/opportunities.schema";
import { describe, expect, it } from "vitest";

const opportunity = normalizedOpportunitySchema.parse({
  source: "FRANCE_TRAVAIL",
  externalIdentifier: "123",
  canonicalUrl: "https://example.com/jobs/123",
  title: "Lead developer React TypeScript",
  company: "Acme",
  description: "Mission longue en full remote sur Next.js",
  location: "France",
  workType: "REMOTE",
  skills: ["React", "TypeScript", "Next.js"],
  dailyRateMin: 650,
  dailyRateMax: 750,
  salaryMin: null,
  salaryMax: null,
  currency: "EUR",
  duration: "12 mois",
  publishedAt: new Date("2026-08-11T10:00:00Z"),
  expiresAt: null,
  provenance: { provider: "France Travail" },
});

const criteria = opportunityCriteriaSchema.parse({
  titles: ["Lead developer"],
  skills: ["React", "TypeScript", "Next.js"],
  location: "France",
  workTypes: ["REMOTE"],
  minDailyRate: 600,
  excludedKeywords: ["stage"],
});

describe("opportunity scoring", () => {
  it("scores an aligned and fresh opportunity with explainable reasons", () => {
    const result = scoreOpportunity(
      opportunity,
      criteria,
      {
        skills: [{ name: "React" }],
        tjmTarget: 650,
        workTypePreference: "REMOTE",
        zone: "France",
      },
      new Date("2026-08-12T10:00:00Z"),
    );

    expect(result.eligible).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(85);
    expect(result.breakdown).toEqual({
      title: 20,
      skills: 40,
      locationAndWorkType: 15,
      compensation: 15,
      freshness: 10,
    });
    expect(result.reasons).toContain("TJM compatible avec la cible");
  });

  it("filters excluded keywords before scoring", () => {
    const result = scoreOpportunity(
      { ...opportunity, description: "Stage de fin d’études" },
      criteria,
      null,
    );
    expect(result).toMatchObject({
      eligible: false,
      score: 0,
      excludedBy: "stage",
    });
  });

  it("does not present an unrelated listing as a match", () => {
    const result = scoreOpportunity(
      {
        ...opportunity,
        title: "Responsable comptable",
        description: "Clôture des comptes annuels",
        skills: ["SAP"],
      },
      criteria,
      null,
    );
    expect(result.eligible).toBe(false);
  });

  it("does not confuse a country with a more specific unrelated area", () => {
    const result = scoreOpportunity(
      { ...opportunity, location: "France" },
      { ...criteria, location: "Île de France" },
      null,
    );
    expect(result.breakdown.locationAndWorkType).toBe(7);
  });
});
