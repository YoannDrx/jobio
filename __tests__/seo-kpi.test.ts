import {
  EXPECTED_PRIVATE_DISALLOWS,
  REQUIRED_PUBLIC_PAGES,
  computeSeoKpiSummary,
} from "@/features/admin/seo-kpi";
import { SiteConfig } from "@/site-config";
import { describe, expect, it } from "vitest";

const toAbsoluteUrl = (path: `/${string}` | "/") =>
  `${SiteConfig.prodUrl}${path === "/" ? "" : path}`;

describe("computeSeoKpiSummary", () => {
  it("flags missing sitemap pages and robots disallow gaps", () => {
    const summary = computeSeoKpiSummary({
      sitemapEntries: [
        { url: toAbsoluteUrl("/") },
        { url: toAbsoluteUrl("/blog") },
        { url: toAbsoluteUrl("/rss.xml") },
      ],
      robotsRules: {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api", "/auth"],
      },
      posts: [
        {
          slug: "old-post",
          title: "Old",
          description: "Old post",
          date: "2025-01-10",
          tags: [],
          content: "",
          readingTime: 3,
        },
      ],
      now: new Date("2026-02-22T00:00:00.000Z"),
    });

    expect(summary.missingRequiredPages).toContain("/docs");
    expect(summary.missingPrivateDisallows).toContain("/job");
    expect(summary.disallowCoveragePercent).toBeLessThan(100);
    expect(summary.blogPostsLast30Days).toBe(0);
    expect(summary.checklist.some((item) => item.status === "warning")).toBe(
      true,
    );
  });

  it("returns healthy status when sitemap, robots and cadence are aligned", () => {
    const summary = computeSeoKpiSummary({
      sitemapEntries: REQUIRED_PUBLIC_PAGES.map((path) => ({
        url: toAbsoluteUrl(path),
      })),
      robotsRules: {
        userAgent: "*",
        allow: "/",
        disallow: [...EXPECTED_PRIVATE_DISALLOWS],
      },
      posts: [
        {
          slug: "recent-1",
          title: "Recent 1",
          description: "Recent post",
          date: "2026-02-15",
          tags: [],
          content: "",
          readingTime: 4,
        },
        {
          slug: "recent-2",
          title: "Recent 2",
          description: "Recent post",
          date: "2026-02-10",
          tags: [],
          content: "",
          readingTime: 4,
        },
      ],
      now: new Date("2026-02-22T00:00:00.000Z"),
    });

    expect(summary.missingRequiredPages).toHaveLength(0);
    expect(summary.missingPrivateDisallows).toHaveLength(0);
    expect(summary.disallowCoveragePercent).toBe(100);
    expect(summary.blogPostsLast30Days).toBeGreaterThanOrEqual(2);
    expect(summary.checklist.every((item) => item.status === "ok")).toBe(true);
  });
});
