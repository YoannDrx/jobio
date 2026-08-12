import { enforcePlanLimit } from "@/lib/plan-limits";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/features/notifications/create-notification";
import { resolvePlanLimitsForUser } from "@/lib/auth/stripe/plan-entitlements";

export type AIQuotaReservation = {
  release: () => Promise<void>;
};

export async function checkAndIncrementAIQuota(
  userId: string,
): Promise<AIQuotaReservation> {
  const { limits } = await resolvePlanLimitsForUser(userId);
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const requestsLimit = limits.aiRequestsPerMonth;

  const quota = await prisma.$transaction(async (tx) => {
    const row = await tx.aIMonthlyQuota.upsert({
      where: { userId_month_year: { userId, month, year } },
      create: {
        userId,
        month,
        year,
        requestsUsed: 0,
        requestsLimit,
      },
      update: { requestsLimit },
    });
    const reservation = await tx.aIMonthlyQuota.updateMany({
      where: { id: row.id, requestsUsed: { lt: requestsLimit } },
      data: { requestsUsed: { increment: 1 } },
    });
    if (reservation.count === 0) return null;
    return tx.aIMonthlyQuota.findUnique({ where: { id: row.id } });
  });

  if (!quota) {
    await enforcePlanLimit(userId, "aiRequestsPerMonth");
    throw new Error("AI quota reservation failed");
  }

  const limit = requestsLimit;
  if (
    quota.requestsUsed >= Math.floor(limit * 0.8) &&
    quota.requestsUsed < limit
  ) {
    await createNotification({
      userId,
      type: "AI_QUOTA_HIGH",
      title: "Quota IA bientôt atteint",
      message: `Tu as utilisé ${quota.requestsUsed}/${limit} requêtes IA ce mois-ci`,
      link: `/job/profiles`,
    });
  }

  let released = false;
  return {
    release: async () => {
      if (released) return;
      released = true;
      await prisma.aIMonthlyQuota.updateMany({
        where: {
          userId,
          month,
          year,
          requestsUsed: { gt: 0 },
        },
        data: { requestsUsed: { decrement: 1 } },
      });
    },
  };
}

export async function getAIQuotaStatus(userId: string) {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const quota = await prisma.aIMonthlyQuota.findUnique({
    where: {
      userId_month_year: { userId, month, year },
    },
  });

  return {
    used: quota?.requestsUsed ?? 0,
  };
}
