"use server";

import { rateLimitedPublicAction } from "@/lib/actions/safe-actions";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { resend } from "@/lib/mail/resend";
import { prisma } from "@/lib/prisma";
import { EmailActionSchema } from "./email.schema";

export const addEmailAction = rateLimitedPublicAction(
  "newsletter-signup",
  5,
  300,
)
  .inputSchema(EmailActionSchema)
  .action(async ({ parsedInput: { email } }) => {
    await prisma.newsletterSubscriber.upsert({
      where: { email },
      create: { email },
      update: { updatedAt: new Date() },
    });

    if (env.RESEND_AUDIENCE_ID) {
      try {
        await resend.contacts.create({
          audienceId: env.RESEND_AUDIENCE_ID,
          email,
        });
      } catch (error) {
        logger.warn("Failed to add contact to Resend Audience", {
          errorName: error instanceof Error ? error.name : "UnknownError",
        });
      }
    }

    return {
      ok: true,
    };
  });
