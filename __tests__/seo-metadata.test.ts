import {
  INDEX_ROBOTS,
  NO_INDEX_ROBOTS,
  buildMarketingMetadata,
} from "@/lib/seo";
import { describe, expect, it } from "vitest";

describe("buildMarketingMetadata", () => {
  it("adds canonical url and default keywords", () => {
    const metadata = buildMarketingMetadata({
      title: "Features | Jobio",
      description: "Toutes les fonctionnalités Jobio.",
      path: "/features",
      keywords: ["crm freelance", "prospection freelance"],
    });

    expect(metadata.alternates?.canonical).toBe("https://jobio.fr/features");
    expect(metadata.keywords).toEqual(
      expect.arrayContaining([
        "Jobio",
        "prospection freelance",
        "CRM freelance",
      ]),
    );
  });

  it("preserves alternate resources while forcing canonical", () => {
    const metadata = buildMarketingMetadata({
      title: "Blog | Jobio",
      description: "Articles Jobio.",
      path: "/blog",
      alternates: {
        types: {
          "application/rss+xml": "https://jobio.fr/rss.xml",
        },
      },
    });

    expect(metadata.alternates?.canonical).toBe("https://jobio.fr/blog");
    expect(metadata.alternates?.types?.["application/rss+xml"]).toBe(
      "https://jobio.fr/rss.xml",
    );
  });

  it("sets noindex robots when requested", () => {
    const metadata = buildMarketingMetadata({
      title: "Private",
      description: "Private page",
      path: "/private",
      noIndex: true,
    });

    expect(metadata.robots).toEqual(NO_INDEX_ROBOTS);
  });

  it("sets index robots by default", () => {
    const metadata = buildMarketingMetadata({
      title: "Public",
      description: "Public page",
      path: "/public",
    });

    expect(metadata.robots).toEqual(INDEX_ROBOTS);
  });
});
