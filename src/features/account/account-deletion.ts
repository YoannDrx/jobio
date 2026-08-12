import { createHash } from "node:crypto";

import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { resend } from "@/lib/mail/resend";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { deleteUserAssets } from "@/lib/files/delete-user-assets";

type DeletableAccount = {
  id: string;
  resendContactId?: string | null;
  stripeCustomerId?: string | null;
};

const isMissingStripeResource = (error: unknown) =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  error.code === "resource_missing";

export const deleteExternalAccountData = async (user: DeletableAccount) => {
  await deleteUserAssets(user.id);
  const storedUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { stripeCustomerId: true, resendContactId: true },
  });
  const stripeCustomerId =
    user.stripeCustomerId ?? storedUser?.stripeCustomerId ?? null;
  const resendContactId =
    user.resendContactId ?? storedUser?.resendContactId ?? null;

  if (stripeCustomerId) {
    try {
      await stripe.customers.del(stripeCustomerId);
    } catch (error) {
      if (!isMissingStripeResource(error)) throw error;
    }
  }

  if (resendContactId && env.RESEND_AUDIENCE_ID) {
    const result = await resend.contacts.remove({
      id: resendContactId,
      audienceId: env.RESEND_AUDIENCE_ID,
    });
    if (result.error && !/not found/i.test(result.error.message)) {
      throw new Error(`RESEND_CONTACT_DELETE_FAILED: ${result.error.name}`);
    }
  }
};

export const finalizeDeletedAccountRetention = async (userId: string) => {
  const anonymizedId = `deleted:${createHash("sha256")
    .update(userId)
    .digest("hex")
    .slice(0, 24)}`;
  const retentionExpiresAt = new Date();
  retentionExpiresAt.setUTCFullYear(retentionExpiresAt.getUTCFullYear() + 2);

  await prisma.proTrialIdentity.updateMany({
    where: { firstUserId: userId },
    data: {
      firstUserId: anonymizedId,
      stripeCustomerId: null,
      retentionExpiresAt,
    },
  });
  logger.info("Account deletion retention finalized", {
    retainedUntil: retentionExpiresAt.toISOString(),
  });
};
