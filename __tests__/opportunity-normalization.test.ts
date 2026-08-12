import {
  canonicalizeOpportunityUrl,
  createOpportunityFingerprint,
  inferOpportunityWorkType,
  normalizeSkills,
} from "@/features/opportunities/opportunity-normalization";
import { describe, expect, it } from "vitest";

describe("opportunity normalization", () => {
  it("removes tracking parameters while preserving business parameters", () => {
    expect(
      canonicalizeOpportunityUrl(
        "https://EXAMPLE.com/jobs/42/?utm_source=linkedin&ref=email&lang=fr#apply",
      ),
    ).toBe("https://example.com/jobs/42?lang=fr");
  });

  it("refuses non-public and non-HTTPS URLs", () => {
    expect(canonicalizeOpportunityUrl("http://example.com/job")).toBeNull();
    expect(canonicalizeOpportunityUrl("https://127.0.0.1/job")).toBeNull();
  });

  it("creates the same fingerprint from cosmetically different listings", () => {
    const base = {
      title: "Développeur React Senior",
      company: "Acme SAS",
      location: "Paris",
      dailyRateMin: 600,
      salaryMin: null,
    };
    expect(createOpportunityFingerprint(base)).toBe(
      createOpportunityFingerprint({
        ...base,
        title: "Developpeur   React senior",
        company: "ACME SAS",
      }),
    );
  });

  it("infers work mode and deduplicates skills", () => {
    expect(inferOpportunityWorkType("Mission 100% remote")).toBe("REMOTE");
    expect(inferOpportunityWorkType("Deux jours en hybride")).toBe("HYBRID");
    expect(normalizeSkills(["React", " react ", "TypeScript"])).toEqual([
      "React",
      "TypeScript",
    ]);
  });
});
