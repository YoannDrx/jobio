import { syncSeoSearchMetricsCacheFromEndpoint } from "@/features/admin/seo-search-metrics";
import { finishCronJobRun, startCronJobRun } from "@/lib/ops/cron-job-runs";
import { NextResponse } from "next/server";
import { route } from "@/lib/zod-route";

export const POST = route.handler(async (req) => {
  const run = await startCronJobRun({
    jobName: "seo-search-metrics-sync",
    route: new URL(req.url).pathname,
  });

  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    await finishCronJobRun(run?.id, {
      status: "UNAUTHORIZED",
      errorMessage: "Invalid authorization header",
    });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
