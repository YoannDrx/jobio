import { prisma } from "@/lib/prisma";

const MAX_DIGEST_ATTEMPTS = 5;
const STALE_CLAIM_MS = 15 * 60 * 1000;

type DigestSendResult =
  | { error: null; data: { id: string } }
  | { error: Error; data: null };

const normalizeDigestError = (error: unknown) => {
  if (error instanceof Error && error.name) {
    return error.name
      .toUpperCase()
      .replace(/[^A-Z0-9_]/g, "_")
      .slice(0, 80);
  }
  return "DELIVERY_FAILED";
};

export const getOpportunityDigestDate = (now = new Date()) =>
  new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

export const deliverOpportunityDigest = async ({
  userId,
  now = new Date(),
  send,
}: {
  userId: string;
  now?: Date;
  send: () => Promise<DigestSendResult>;
}): Promise<"sent" | "failed" | "skipped"> => {
  const digestDate = getOpportunityDigestDate(now);
  const staleBefore = new Date(now.getTime() - STALE_CLAIM_MS);

  await prisma.opportunityDigestDelivery.createMany({
    data: [{ userId, digestDate }],
    skipDuplicates: true,
  });
  const delivery = await prisma.opportunityDigestDelivery.findUniqueOrThrow({
    where: { userId_digestDate: { userId, digestDate } },
    select: { id: true },
  });
  const claim = await prisma.opportunityDigestDelivery.updateMany({
    where: {
      id: delivery.id,
      attemptCount: { lt: MAX_DIGEST_ATTEMPTS },
      OR: [
        { status: { in: ["PENDING", "FAILED"] } },
        { status: "SENDING", claimedAt: { lt: staleBefore } },
      ],
    },
    data: {
      status: "SENDING",
      attemptCount: { increment: 1 },
      claimedAt: now,
      lastAttemptAt: now,
      errorCode: null,
    },
  });

  if (claim.count === 0) return "skipped";

  try {
    const result = await send();
    if (result.error) throw result.error;
    await prisma.opportunityDigestDelivery.updateMany({
      where: { id: delivery.id, status: "SENDING", claimedAt: now },
      data: {
        status: "SENT",
        providerEmailId: result.data.id,
        sentAt: new Date(),
      },
    });
    return "sent";
  } catch (error) {
    await prisma.opportunityDigestDelivery.updateMany({
      where: { id: delivery.id, status: "SENDING", claimedAt: now },
      data: {
        status: "FAILED",
        errorCode: normalizeDigestError(error),
      },
    });
    return "failed";
  }
};
