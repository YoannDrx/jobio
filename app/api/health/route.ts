import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { redisClient } from "@/lib/redis";
import { route } from "@/lib/zod-route";

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number) => {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timeout = setTimeout(
          () => reject(new Error("Healthcheck timeout")),
          timeoutMs,
        );
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
};

export const GET = route.handler(async () => {
  const startedAt = Date.now();
  const [database, redis] = await Promise.allSettled([
    withTimeout(prisma.$queryRaw`SELECT 1`, 2_000),
    withTimeout(redisClient.ping(), 2_000),
  ]);
  const checks = {
    database: database.status === "fulfilled" ? "ok" : "error",
    redis: redis.status === "fulfilled" ? "ok" : "error",
  } as const;
  const healthy = checks.database === "ok" && checks.redis === "ok";

  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      checks,
      durationMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
      release: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ?? "local",
    },
    {
      status: healthy ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    },
  );
});
