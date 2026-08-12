import { route } from "@/lib/zod-route";
import { NextResponse } from "next/server";
import { finishCronJobRun, startCronJobRun } from "@/lib/ops/cron-job-runs";
import { validateCronAuthorization } from "@/lib/security/cron-auth";
import { logger } from "@/lib/logger";
import { upfetch } from "@/lib/up-fetch";
import { DAILY_CRON_JOBS } from "@/lib/ops/daily-cron-jobs";

export const GET = route.handler(async (req) => {
  const authFailure = validateCronAuthorization(
    req.headers.get("authorization"),
  );
  if (authFailure) {
    return NextResponse.json(
      { error: authFailure.publicError },
      { status: authFailure.status },
    );
  }

  const run = await startCronJobRun({
    jobName: "daily-orchestrator",
    route: new URL(req.url).pathname,
  });

  const publicUrl =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ??
    process.env.NEXT_PUBLIC_URL?.trim();
  const vercelUrl = process.env.VERCEL_URL?.trim();
  const baseUrl = publicUrl
    ? new URL(publicUrl).origin
    : vercelUrl
      ? `https://${vercelUrl}`
      : new URL(req.url).origin;

  const authorization = req.headers.get("authorization") ?? "";

  const jobResults = await Promise.all(
    DAILY_CRON_JOBS.map(async (job) => {
      const start = Date.now();
      try {
        await upfetch(`${baseUrl}${job.path}`, {
          method: job.method,
          headers: { authorization },
        });
        return [job.path, { status: "ok", ms: Date.now() - start }] as const;
      } catch (error) {
        logger.error(`[daily-cron] ${job.path} failed`, error);
        return [job.path, { status: "error", ms: Date.now() - start }] as const;
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
    status: successCount === DAILY_CRON_JOBS.length ? "SUCCESS" : "FAILED",
    processedCount: successCount,
    details: results,
  });

  return NextResponse.json(
    {
      executed: DAILY_CRON_JOBS.length,
      success: successCount,
      results,
    },
    { status: successCount === DAILY_CRON_JOBS.length ? 200 : 503 },
  );
});
