import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { z } from "zod";
import { getDeliveryEventUpdate } from "@/features/emails/delivery-status";
import { processInboundOpportunityEmail } from "@/features/opportunities/inbound-opportunity-email";
import { route } from "@/lib/zod-route";

const ResendWebhookSchema = z.object({
  type: z.string(),
  created_at: z.string(),
  data: z
    .object({
      email_id: z.string().optional(),
      to: z.array(z.string()).optional(),
      from: z.string().optional(),
      subject: z.string().nullish(),
    })
    .passthrough(),
});

const MAX_RESEND_WEBHOOK_BYTES = 256_000;

/**
 * Resend webhooks
 *
 * @docs How it work https://resend.com/docs/dashboard/webhooks/introduction
 * @docs Event type https://resend.com/docs/dashboard/webhooks/event-types
 */
export const POST = route.handler(async (req) => {
  const declaredLength = Number(req.headers.get("content-length") ?? 0);
  if (
    Number.isFinite(declaredLength) &&
    declaredLength > MAX_RESEND_WEBHOOK_BYTES
  ) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

  const body = await req.text();
  if (Buffer.byteLength(body, "utf8") > MAX_RESEND_WEBHOOK_BYTES) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

  const svixId = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSignature = req.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json(
      { error: "Missing svix headers" },
      { status: 401 },
    );
  }

  try {
    const wh = new Webhook(env.RESEND_WEBHOOK_SECRET ?? "");
    wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    });
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = ResendWebhookSchema.parse(JSON.parse(body));
  const emailId = event.data.email_id;

  if (
    event.type === "email.received" &&
    emailId &&
    event.data.to &&
    event.data.from
  ) {
    const receivedAt = new Date(event.created_at);
    try {
      await processInboundOpportunityEmail({
        emailId,
        to: event.data.to,
        from: event.data.from,
        subject: event.data.subject ?? null,
        receivedAt: Number.isNaN(receivedAt.getTime())
          ? new Date()
          : receivedAt,
      });
    } catch (error) {
      logger.error("Inbound opportunity email processing failed", error);
      return NextResponse.json(
        { error: "Inbound processing failed" },
        { status: 503 },
      );
    }
  }

  if (emailId) {
    const sentEmail = await prisma.sentEmail.findUnique({
      where: { resendId: emailId },
    });

    if (sentEmail) {
      const occurredAt = new Date(event.created_at);
      const update = getDeliveryEventUpdate({
        currentStatus: sentEmail.status,
        eventType: event.type,
        occurredAt: Number.isNaN(occurredAt.getTime())
          ? new Date()
          : occurredAt,
      });
      if (update) {
        await prisma.sentEmail.update({
          where: { id: sentEmail.id },
          data: update,
        });
      }
    }
  }

  if (
    event.type === "email.bounced" ||
    event.type === "email.complained" ||
    event.type === "email.suppressed"
  ) {
    logger.warn("Resend delivery incident", {
      eventType: event.type,
      emailId: emailId ?? "unknown",
    });
  }

  return NextResponse.json({
    ok: true,
  });
});
