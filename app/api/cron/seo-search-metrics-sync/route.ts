import { SEO_SYNC_JOB_NAMES } from "@/features/admin/seo-sync-jobs";
import { syncSeoSearchMetricsCacheFromEndpoint } from "@/features/admin/seo-search-metrics";
import {
  findActiveCronJobRun,
  finishCronJobRun,
  startCronJobRun,
} from "@/lib/ops/cron-job-runs";
import { validateCronAuthorization } from "@/lib/security/cron-auth";
import { NextResponse } from "next/server";
import { route } from "@/lib/zod-route";

export const POST = route.handler(async (req) => {
  const authFailure = validateCronAuthorization(req.headers.get("authorization"));
  if (authFailure) {
    return NextResponse.json(
      { error: authFailure.publicError },
      { status: authFailure.status },
    );
  }

  const activeRun = await findActiveCronJobRun({
    jobNames: [...SEO_SYNC_JOB_NAMES],
  });
  if (activeRun) {
    return NextResponse.json(
      {
        error: "SEO sync already running",
        activeRun: {
          id: activeRun.id,
          jobName: activeRun.jobName,
          startedAt: activeRun.startedAt.toISOString(),
        },
      },
      { status: 409 },
    );
  }

  const run = await startCronJobRun({
    jobName: "seo-search-metrics-sync",
    route: new URL(req.url).pathname,
  });

  try {
    const syncResult = await syncSeoSearchMetricsCacheFromEndpoint();

    if (!syncResult.success || !syncResult.payload) {
      await finishCronJobRun(run?.id, {
        status: "FAILED",
        errorMessage: syncResult.error ?? "SEO metrics sync failed",
      });

      return NextResponse.json(
        {
          error: syncResult.error ?? "SEO metrics sync failed",
        },
        { status: 503 },
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

    return NextResponse.json({
      synced: true,
      provider: syncResult.payload.current.provider,
      capturedAt: syncResult.payload.current.capturedAt,
    });
  } catch (error) {
    await finishCronJobRun(run?.id, {
      status: "FAILED",
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json({ error: "Cron failure" }, { status: 500 });
  }
});
