import { adzunaProvider } from "@/features/opportunities/providers/adzuna";
import { franceTravailProvider } from "@/features/opportunities/providers/france-travail";
import { joobleProvider } from "@/features/opportunities/providers/jooble";
import { opportunityCriteriaSchema } from "@/features/opportunities/opportunities.schema";
import { upfetch } from "@/lib/up-fetch";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/up-fetch", () => ({ upfetch: vi.fn() }));

const criteria = opportunityCriteriaSchema.parse({
  titles: ["Développeur React"],
  skills: ["React"],
  location: "Paris",
  workTypes: ["REMOTE"],
  excludedKeywords: [],
});

describe("opportunity providers", () => {
  beforeEach(() => {
    vi.mocked(upfetch).mockReset();
  });

  it("normalizes a France Travail response", async () => {
    vi.mocked(upfetch)
      .mockResolvedValueOnce({ access_token: "token" } as never)
      .mockResolvedValueOnce({
        resultats: [
          {
            id: "ft-1",
            intitule: "Développeur React freelance",
            description: "Mission full remote",
            dateCreation: "2026-08-12T08:00:00Z",
            dateActualisation: "2026-08-12T09:00:00Z",
            lieuTravail: { libelle: "Paris" },
            entreprise: { nom: "Acme" },
            origineOffre: {
              urlOrigine: "https://example.com/ft-1?utm_source=x",
            },
            competences: [{ libelle: "React" }],
            salaire: { libelle: "650 € / jour" },
            typeContratLibelle: "Mission 12 mois",
          },
        ],
      } as never);

    const page = await franceTravailProvider.search(criteria, null);
    expect(page.items[0]).toMatchObject({
      source: "FRANCE_TRAVAIL",
      externalIdentifier: "ft-1",
      canonicalUrl: "https://example.com/ft-1",
      workType: "REMOTE",
      skills: ["React"],
      dailyRateMin: 650,
    });
  });

  it("normalizes an Adzuna response", async () => {
    vi.mocked(upfetch).mockResolvedValueOnce({
      results: [
        {
          id: "adz-1",
          title: "React Engineer",
          description: "Hybrid contract",
          redirect_url: "https://example.com/adz-1",
          created: "2026-08-12T08:00:00Z",
          company: { display_name: "Beta" },
          location: { display_name: "Lyon" },
          salary_min: 60_000,
          salary_max: 75_000,
          contract_time: "full_time",
          contract_type: "contract",
        },
      ],
    } as never);

    const page = await adzunaProvider.search(criteria, null);
    expect(page.items[0]).toMatchObject({
      source: "ADZUNA",
      externalIdentifier: "adz-1",
      company: "Beta",
      workType: "HYBRID",
      salaryMax: 75_000,
    });
  });

  it("normalizes a Jooble response without inventing compensation", async () => {
    vi.mocked(upfetch).mockResolvedValueOnce({
      jobs: [
        {
          id: 42,
          title: "Senior React consultant",
          company: "Gamma",
          snippet: "Remote possible",
          location: "France",
          salary: "Competitive",
          source: "Partner",
          link: "https://example.com/jooble-42",
          updated: "2026-08-12T08:00:00Z",
          type: "Contract",
        },
      ],
    } as never);

    const page = await joobleProvider.search(criteria, null);
    expect(page.items[0]).toMatchObject({
      source: "JOOBLE",
      externalIdentifier: "42",
      workType: "REMOTE",
      dailyRateMin: null,
      salaryMin: null,
    });
  });
});
