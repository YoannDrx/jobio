"use server";

import { blogPosts } from "@/features/blog/blog-data";
import { computeSeoKpiSummary } from "@/features/admin/seo-kpi";
import robots from "../../robots";
import sitemap from "../../sitemap";

export const getSeoKpiSummary = async () => {
  const [sitemapEntries, robotsMetadata] = await Promise.all([
    sitemap(),
    Promise.resolve(robots()),
  ]);

  return computeSeoKpiSummary({
    sitemapEntries,
    robotsRules: robotsMetadata.rules,
    posts: blogPosts,
    now: new Date(),
  });
};
