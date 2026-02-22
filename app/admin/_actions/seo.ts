"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { ApplicationError } from "@/lib/errors/application-error";
import { blogPosts } from "@/features/blog/blog-data";
import { computeSeoKpiSummary } from "@/features/admin/seo-kpi";
import {
  loadSeoSearchMetricsState,
  syncSeoSearchMetricsCacheFromEndpoint,
} from "@/features/admin/seo-search-metrics";
import { finishCronJobRun, startCronJobRun } from "@/lib/ops/cron-job-runs";
import { z } from "zod";
import { createAdminAuditLog } from "./admin-audit";
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

const syncSeoMetricsSchema = z.object({});

export const syncSeoMetricsNowAction = authAction
  .inputSchema(syncSeoMetricsSchema)
  .action(async ({ ctx: { user } }) => {
    if (user.role !== "admin") {
      throw new ApplicationError("Accès administrateur requis");
    }

    const run = await startCronJobRun({
      jobName: "seo-search-metrics-sync-manual",
      route: "/admin/ops",
    });

    const syncResult = await syncSeoSearchMetricsCacheFromEndpoint();

    if (!syncResult.success || !syncResult.payload) {
      await finishCronJobRun(run?.id, {
        status: "FAILED",
        errorMessage: syncResult.error ?? "SEO metrics sync failed",
      });

      throw new ApplicationError(
        syncResult.error ?? "Impossible de synchroniser les métriques SEO",
      );
    }

    await finishCronJobRun(run?.id, {
      status: "SUCCESS",
      processedCount: 1,
      details: {
        provider: syncResult.payload.current.provider,
        period: syncResult.payload.current.period,
        capturedAt: syncResult.payload.current.capturedAt,
      },
    });

    await createAdminAuditLog({
      action: "SEO_SEARCH_METRICS_SYNCED_MANUAL",
      actorUserId: user.id,
      actorEmail: user.email,
      metadata: {
        provider: syncResult.payload.current.provider,
        capturedAt: syncResult.payload.current.capturedAt,
        period: syncResult.payload.current.period,
      },
    });

    return {
      success: true,
      provider: syncResult.payload.current.provider,
      capturedAt: syncResult.payload.current.capturedAt,
    };
  });
