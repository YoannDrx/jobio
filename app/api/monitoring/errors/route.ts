import { NextResponse } from "next/server";
import { z } from "zod";
import { logSystemError } from "@/lib/monitoring/log-system-error";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { route } from "@/lib/zod-route";
import { createHash } from "node:crypto";

const clientErrorSchema = z.object({
  source: z.string().min(2).max(100),
  message: z.string().min(1).max(5000),
  stack: z.string().max(20_000).optional(),
  route: z.string().max(1000).optional(),
  severity: z.enum(["INFO", "WARNING", "ERROR", "CRITICAL"]).optional(),
  context: z.record(z.string(), z.unknown()).optional(),
});

export const POST = route
  .body(clientErrorSchema)
  .handler(async (request, { body }) => {
    const clientAddress =
      request.headers.get("x-forwarded-for")?.split(",").at(0)?.trim() ??
      request.headers.get("x-real-ip") ??
      "unknown";
    const fingerprint = createHash("sha256")
      .update(clientAddress)
      .digest("hex")
      .slice(0, 24);
    const limit = await enforceRateLimit({
      key: `client-errors:${fingerprint}`,
      limit: 20,
      windowSeconds: 300,
    });
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "rate_limited" },
        {
          status: 429,
          headers: { "Retry-After": String(limit.retryAfterSeconds) },
        },
      );
    }

    logSystemError({
      source: body.source,
      message: body.message,
      stack: body.stack,
      route: body.route,
      severity: body.severity ?? "ERROR",
      context: body.context,
    });

    return new NextResponse(null, { status: 204 });
  });
