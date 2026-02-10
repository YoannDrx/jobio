import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { z } from "zod";

const ResendWebhookSchema = z.object({
  type: z.string(),
  created_at: z.string(),
  data: z
    .object({
      email_id: z.string().optional(),
    })
    .passthrough(),
});

/**
 * Resend webhooks
 *
 * @docs How it work https://resend.com/docs/dashboard/webhooks/introduction
 * @docs Event type https://resend.com/docs/dashboard/webhooks/event-types
 */
export const POST = async (req: NextRequest) => {
  const body = await req.text();

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

  if (emailId) {
    const sentEmail = await prisma.sentEmail.findUnique({
      where: { resendId: emailId },
    });

    if (sentEmail) {
      const now = new Date();
      switch (event.type) {
        case "email.delivered":
          await prisma.sentEmail.update({
            where: { id: sentEmail.id },
            data: { status: "delivered", deliveredAt: now },
          });
          break;
        case "email.opened":
          await prisma.sentEmail.update({
            where: { id: sentEmail.id },
            data: { status: "opened", openedAt: now },
          });
          break;
        case "email.clicked":
          await prisma.sentEmail.update({
            where: { id: sentEmail.id },
            data: { status: "clicked", clickedAt: now },
          });
          break;
        case "email.bounced":
          await prisma.sentEmail.update({
            where: { id: sentEmail.id },
            data: { status: "bounced", bouncedAt: now },
          });
          break;
        case "email.complained":
          await prisma.sentEmail.update({
            where: { id: sentEmail.id },
            data: { status: "complained" },
          });
          break;
      }
    }
  }

  if (event.type === "email.bounced" || event.type === "email.complained") {
    logger.warn(`Email ${event.type}`, event.data);
  }

  return NextResponse.json({
    ok: true,
  });
};
