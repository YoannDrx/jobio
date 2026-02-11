import { NextResponse } from "next/server";
import { z } from "zod";
import { logSystemError } from "@/lib/monitoring/log-system-error";

const clientErrorSchema = z.object({
  source: z.string().min(2).max(100),
  message: z.string().min(1).max(5000),
  stack: z.string().max(20_000).optional(),
  route: z.string().max(1000).optional(),
  severity: z.enum(["INFO", "WARNING", "ERROR", "CRITICAL"]).optional(),
  context: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = clientErrorSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  logSystemError({
    source: parsed.data.source,
    message: parsed.data.message,
    stack: parsed.data.stack,
    route: parsed.data.route,
    severity: parsed.data.severity ?? "ERROR",
    context: parsed.data.context,
  });

  return new NextResponse(null, { status: 204 });
}
