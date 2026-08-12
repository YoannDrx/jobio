import {
  createOpportunityWatchSchema,
  manualOpportunitySchema,
} from "@/features/opportunities/opportunities.schema";
import { describe, expect, it } from "vitest";

describe("opportunity schemas", () => {
  it("validates bounded watch criteria", () => {
    expect(
      createOpportunityWatchSchema.safeParse({
        name: "React France",
        criteria: {
          titles: ["Développeur React"],
          skills: ["React"],
          workTypes: ["REMOTE"],
          excludedKeywords: ["stage"],
        },
        sources: ["FRANCE_TRAVAIL"],
      }).success,
    ).toBe(true);
  });

  it("rejects empty sources, excessive values and private manual URLs", () => {
    expect(
      createOpportunityWatchSchema.safeParse({
        name: "Watch",
        criteria: { titles: ["React"], workTypes: [], excludedKeywords: [] },
        sources: [],
      }).success,
    ).toBe(false);
    expect(
      manualOpportunitySchema.safeParse({
        content: "Une annonce suffisamment longue pour être analysée.",
        sourceUrl: "https://10.0.0.1/secret",
      }).success,
    ).toBe(false);
  });
});
