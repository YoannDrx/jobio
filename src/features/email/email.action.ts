"use server";

import { action } from "@/lib/actions/safe-actions";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { resend } from "@/lib/mail/resend";
import { prisma } from "@/lib/prisma";
import { EmailActionSchema } from "./email.schema";

export const addEmailAction = action
  .inputSchema(EmailActionSchema)
  .action(async ({ parsedInput: { email } }) => {
    logger.info("Add email", { email });

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
        logger.warn("Failed to add contact to Resend Audience", { error });
      }
    }

    return {
      ok: true,
    };
  });
