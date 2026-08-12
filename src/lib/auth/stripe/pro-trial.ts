import { createHmac } from "node:crypto";

import { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";

export const PRO_TRIAL_DAYS = 14;

const getTrialSecret = () => {
  if (process.env.BETTER_AUTH_SECRET) return process.env.BETTER_AUTH_SECRET;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "BETTER_AUTH_SECRET is required to secure trial identities",
    );
  }
  return "jobio-local-trial-fingerprint";
};

export const getTrialEmailFingerprint = (email: string): string =>
  createHmac("sha256", getTrialSecret())
    .update(email.trim().toLowerCase())
    .digest("hex");

export const getProTrialEndsAt = (startedAt: Date): Date =>
  new Date(startedAt.getTime() + PRO_TRIAL_DAYS * 24 * 60 * 60 * 1000);

export const initializeProTrialForUser = async (input: {
  userId: string;
  email: string;
  now?: Date;
}) => {
  const now = input.now ?? new Date();
  const emailFingerprint = getTrialEmailFingerprint(input.email);

  try {
    return await prisma.$transaction(async (tx) => {
      const userExists = await tx.user.findUnique({
        where: { id: input.userId },
        select: { id: true },
      });

      // Better Auth may finish a signup response before all after-hooks have
      // settled. An immediate account deletion must not recreate preferences
      // for a user that no longer exists.
      if (!userExists) {
        return { granted: false, startedAt: null, endsAt: null } as const;
      }

      const identity = await tx.proTrialIdentity.findUnique({
        where: { emailFingerprint },
      });

      if (
        identity?.consumedAt ||
        (identity && identity.firstUserId !== input.userId)
      ) {
        await tx.userPreference.upsert({
          where: { userId: input.userId },
          create: {
            userId: input.userId,
            proTrialConsumedAt: now,
          },
          update: {
            proTrialStartedAt: null,
            proTrialEndsAt: null,
            proTrialConsumedAt: now,
          },
        });

        return { granted: false, startedAt: null, endsAt: null } as const;
      }

      const startedAt = identity?.createdAt ?? now;
      const endsAt = getProTrialEndsAt(startedAt);

      if (!identity) {
        await tx.proTrialIdentity.create({
          data: {
            emailFingerprint,
            firstUserId: input.userId,
          },
        });
      }

      await tx.userPreference.upsert({
        where: { userId: input.userId },
        create: {
          userId: input.userId,
          proTrialStartedAt: startedAt,
          proTrialEndsAt: endsAt,
        },
        update: {
          proTrialStartedAt: startedAt,
          proTrialEndsAt: endsAt,
        },
      });

      return { granted: true, startedAt, endsAt } as const;
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      return { granted: false, startedAt: null, endsAt: null } as const;
    }
    throw error;
  }
};

export const linkStripeCustomerToTrialIdentity = async (input: {
  userId: string;
  email: string;
  stripeCustomerId: string;
}) => {
  const emailFingerprint = getTrialEmailFingerprint(input.email);

  await prisma.proTrialIdentity.upsert({
    where: { emailFingerprint },
    create: {
      emailFingerprint,
      firstUserId: input.userId,
      stripeCustomerId: input.stripeCustomerId,
    },
    update: {
      stripeCustomerId: input.stripeCustomerId,
    },
  });
};

export const markProTrialConsumed = async (input: {
  userId: string;
  email: string;
  consumedAt?: Date;
}) => {
  const consumedAt = input.consumedAt ?? new Date();
  const emailFingerprint = getTrialEmailFingerprint(input.email);

  await prisma.$transaction([
    prisma.userPreference.updateMany({
      where: {
        userId: input.userId,
        proTrialConsumedAt: null,
      },
      data: { proTrialConsumedAt: consumedAt },
    }),
    prisma.proTrialIdentity.updateMany({
      where: { emailFingerprint, consumedAt: null },
      data: { consumedAt },
    }),
  ]);
};

export const purgeExpiredTrialIdentities = async (now = new Date()) =>
  prisma.proTrialIdentity.deleteMany({
    where: { retentionExpiresAt: { lte: now } },
  });
