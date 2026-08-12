import {
  EXPECTED_PRIVATE_DISALLOWS,
  REQUIRED_PUBLIC_PAGES,
  computeSeoKpiSummary,
} from "@/features/admin/seo-kpi";
import type { SeoSearchMetricsState } from "@/features/admin/seo-search-metrics";
import { SiteConfig } from "@/site-config";
import { describe, expect, it } from "vitest";

const toAbsoluteUrl = (path: `/${string}` | "/") =>
  `${SiteConfig.prodUrl}${path === "/" ? "" : path}`;

const defaultSearchMetricsState: SeoSearchMetricsState = {
  status: "not_configured",
  source: "none",
  payload: null,
  error: null,
};

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
      searchMetricsState: defaultSearchMetricsState,
      now: new Date("2026-02-22T00:00:00.000Z"),
    });

    expect(summary.missingRequiredPages).toContain("/docs");
    expect(summary.missingPrivateDisallows).toContain("/job");
    expect(summary.disallowCoveragePercent).toBeLessThan(100);
    expect(summary.blogPostsLast30Days).toBe(0);
    expect(summary.searchPerformance.status).toBe("not_configured");
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
      searchMetricsState: {
        status: "configured",
        source: "env_json",
        payload: {
          current: {
            provider: "google_search_console",
            capturedAt: "2026-02-22T09:00:00.000Z",
            period: {
              from: "2026-01-26",
              to: "2026-02-22",
              label: "28 derniers jours",
            },
            totals: {
              clicks: 560,
              impressions: 12000,
              ctr: 0.046,
              averagePosition: 15.4,
            },
            indexedPages: {
              public: 41,
              private: 0,
            },
            topQueries: [
              {
                query: "crm freelance",
                clicks: 73,
                impressions: 900,
                ctr: 0.081,
                position: 8.2,
              },
            ],
          },
          previous: {
            provider: "google_search_console",
            capturedAt: "2026-01-26T09:00:00.000Z",
            period: {
              from: "2025-12-30",
              to: "2026-01-26",
              label: "28 jours précédents",
            },
            totals: {
              clicks: 500,
              impressions: 10000,
              ctr: 0.05,
              averagePosition: 16.1,
            },
            indexedPages: {
              public: 38,
              private: 0,
            },
          },
        },
        error: null,
      },
      now: new Date("2026-02-22T00:00:00.000Z"),
    });

    expect(summary.missingRequiredPages).toHaveLength(0);
    expect(summary.missingPrivateDisallows).toHaveLength(0);
    expect(summary.disallowCoveragePercent).toBe(100);
    expect(summary.blogPostsLast30Days).toBeGreaterThanOrEqual(2);
    expect(summary.searchPerformance.status).toBe("configured");
    expect(summary.searchPerformance.clicks).toBe(560);
    expect(summary.searchPerformance.clicksDeltaPercent).toBe(12);
    expect(summary.searchPerformance.snapshotAgeDays).toBe(0);
    expect(summary.searchPerformance.isSnapshotStale).toBe(false);
    expect(summary.searchPerformance.topQueries).toHaveLength(1);
    expect(summary.searchPerformance.contentRefreshCandidates).toHaveLength(0);
    expect(summary.checklist.every((item) => item.status === "ok")).toBe(true);
  });

  it("flags stale search snapshots for refresh", () => {
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
          date: "2026-02-18",
          tags: [],
          content: "",
          readingTime: 4,
        },
        {
          slug: "recent-2",
          title: "Recent 2",
          description: "Recent post",
          date: "2026-02-16",
          tags: [],
          content: "",
          readingTime: 4,
        },
      ],
      searchMetricsState: {
        status: "configured",
        source: "redis_cache",
        payload: {
          current: {
            provider: "combined",
            capturedAt: "2026-02-10T09:00:00.000Z",
            period: {
              from: "2026-01-13",
              to: "2026-02-10",
              label: "28 derniers jours",
            },
            totals: {
              clicks: 400,
              impressions: 9000,
              ctr: 0.044,
              averagePosition: 16.2,
            },
            indexedPages: {
              public: 39,
              private: 0,
            },
          },
        },
        error: null,
      },
      now: new Date("2026-02-22T00:00:00.000Z"),
    });

    const metricsChecklist = summary.checklist.find(
      (item) => item.id === "external-search-metrics",
    );

    expect(summary.searchPerformance.snapshotAgeDays).toBe(11);
    expect(summary.searchPerformance.isSnapshotStale).toBe(true);
    expect(metricsChecklist?.status).toBe("warning");
    expect(
      summary.recommendedActions.some((action) =>
        action.includes("refresh des métriques SEO"),
      ),
    ).toBe(true);
  });

  it("suggests refresh candidates when blog pages have low CTR", () => {
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
          date: "2026-02-18",
          tags: [],
          content: "",
          readingTime: 4,
        },
        {
          slug: "recent-2",
          title: "Recent 2",
          description: "Recent post",
          date: "2026-02-16",
          tags: [],
          content: "",
          readingTime: 4,
        },
      ],
      searchMetricsState: {
        status: "configured",
        source: "env_json",
        payload: {
          current: {
            provider: "google_search_console",
            capturedAt: "2026-02-22T09:00:00.000Z",
            period: {
              from: "2026-01-26",
              to: "2026-02-22",
              label: "28 derniers jours",
            },
            totals: {
              clicks: 560,
              impressions: 12000,
              ctr: 0.046,
              averagePosition: 15.4,
            },
            topPages: [
              {
                path: "/blog/facturation-freelance-devis-factures-conformite",
                clicks: 10,
                impressions: 900,
                ctr: 0.011,
              },
              {
                path: "/features",
                clicks: 15,
                impressions: 600,
                ctr: 0.025,
              },
            ],
          },
        },
        error: null,
      },
      now: new Date("2026-02-22T00:00:00.000Z"),
    });

    expect(summary.searchPerformance.contentRefreshCandidates).toHaveLength(1);
    expect(summary.searchPerformance.contentRefreshCandidates[0]?.path).toBe(
      "/blog/facturation-freelance-devis-factures-conformite",
    );
    expect(
      summary.recommendedActions.some((action) =>
        action.includes("faible CTR"),
      ),
    ).toBe(true);
  });

  it("tracks refresh follow-up checkpoints after content updates", () => {
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
          date: "2026-02-18",
          tags: [],
          content: "",
          readingTime: 4,
        },
      ],
      searchMetricsState: {
        status: "configured",
        source: "env_json",
        payload: {
          current: {
            provider: "google_search_console",
            capturedAt: "2026-03-10T09:00:00.000Z",
            period: {
              from: "2026-02-10",
              to: "2026-03-10",
              label: "28 derniers jours",
            },
            totals: {
              clicks: 300,
              impressions: 7000,
              ctr: 0.042,
              averagePosition: 14.8,
            },
            topPages: [
              {
                path: "/blog/structurer-prospection-freelance-2026",
                clicks: 14,
                impressions: 620,
                ctr: 0.022,
              },
            ],
          },
        },
        error: null,
      },
      now: new Date("2026-03-10T00:00:00.000Z"),
    });

    const followUp = summary.searchPerformance.refreshFollowUps.find(
      (item) => item.path === "/blog/structurer-prospection-freelance-2026",
    );

    expect(
      summary.searchPerformance.refreshFollowUps.length,
    ).toBeGreaterThanOrEqual(4);
    expect(followUp?.milestone).toBe("J+14");
    expect(followUp?.status).toBe("due");
    expect(followUp?.ctr).toBe(2.2);
    expect(
      summary.recommendedActions.some((action) =>
        action.includes("checkpoints post-refresh SEO"),
      ),
    ).toBe(true);
  });

  it("marks search metrics as warning when payload is invalid", () => {
    const summary = computeSeoKpiSummary({
      sitemapEntries: REQUIRED_PUBLIC_PAGES.map((path) => ({
        url: toAbsoluteUrl(path),
      })),
      robotsRules: {
        userAgent: "*",
        allow: "/",
        disallow: [...EXPECTED_PRIVATE_DISALLOWS],
      },
      posts: [],
      searchMetricsState: {
        status: "invalid",
        source: "file",
        payload: null,
        error: "Unexpected token",
      },
      now: new Date("2026-02-22T00:00:00.000Z"),
    });

    const metricsChecklist = summary.checklist.find(
      (item) => item.id === "external-search-metrics",
    );

    expect(metricsChecklist?.status).toBe("warning");
    expect(
      summary.recommendedActions.some((action) => action.includes("JSON")),
    ).toBe(true);
  });
});
