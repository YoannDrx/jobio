import { route } from "@/lib/zod-route";
import { NextResponse } from "next/server";
import { finishCronJobRun, startCronJobRun } from "@/lib/ops/cron-job-runs";
import { validateCronAuthorization } from "@/lib/security/cron-auth";
import { logger } from "@/lib/logger";

const CRON_JOBS = [
  "/api/cron/recurring-invoices",
  "/api/cron/billing-reminders",
  "/api/cron/push-notifications",
  "/api/cron/analytics-snapshot",
  "/api/cron/trial-ending",
  "/api/cron/trial-reminders",
  "/api/cron/seo-search-metrics-sync",
] as const;

export const GET = route.handler(async (req) => {
  const run = await startCronJobRun({
    jobName: "daily-orchestrator",
    route: new URL(req.url).pathname,
  });

  const authFailure = validateCronAuthorization(
    req.headers.get("authorization"),
  );
  if (authFailure) {
    await finishCronJobRun(run?.id, {
      status: authFailure.status === 401 ? "UNAUTHORIZED" : "FAILED",
      errorMessage: authFailure.logMessage,
    });
    return NextResponse.json(
      { error: authFailure.publicError },
      { status: authFailure.status },
    );
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_URL || process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";

  const authorization = req.headers.get("authorization") ?? "";

  const jobResults = await Promise.all(
    CRON_JOBS.map(async (jobPath) => {
      const start = Date.now();
      try {
        const response = await fetch(`${baseUrl}${jobPath}`, {
          headers: { authorization },
        });
        if (!response.ok) {
          logger.warn(`[daily-cron] ${jobPath} returned ${response.status}`);
        }
        return [
          jobPath,
          { status: response.ok ? "ok" : "error", ms: Date.now() - start },
        ] as const;
      } catch (error) {
        logger.error(`[daily-cron] ${jobPath} failed`, error);
        return [jobPath, { status: "error", ms: Date.now() - start }] as const;
      }
    }),
  );

  const results = Object.fromEntries(jobResults) as Record<
    string,
    { status: "ok" | "error"; ms: number }
  >;

  const successCount = Object.values(results).filter(
    (r) => r.status === "ok",
  ).length;

  await finishCronJobRun(run?.id, {
    status: successCount === CRON_JOBS.length ? "SUCCESS" : "FAILED",
    processedCount: successCount,
    details: results,
  });

  return NextResponse.json({
    executed: CRON_JOBS.length,
    success: successCount,
    results,
  });
});
