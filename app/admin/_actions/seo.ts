"use server";

import { blogPosts } from "@/features/blog/blog-data";
import { computeSeoKpiSummary } from "@/features/admin/seo-kpi";
import { loadSeoSearchMetricsState } from "@/features/admin/seo-search-metrics";
import robots from "../../robots";
import sitemap from "../../sitemap";

export const getSeoKpiSummary = async () => {
  const [sitemapEntries, robotsMetadata, searchMetricsState] = await Promise.all([
    sitemap(),
    Promise.resolve(robots()),
    loadSeoSearchMetricsState(),
  ]);

  return computeSeoKpiSummary({
    sitemapEntries,
    robotsRules: robotsMetadata.rules,
    posts: blogPosts,
    searchMetricsState,
    now: new Date(),
  });
};
