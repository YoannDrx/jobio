import { enforcePlanLimit } from "@/lib/plan-limits";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/features/notifications/create-notification";

export async function checkAndIncrementAIQuota(userId: string): Promise<void> {
  const quotaLimit = await enforcePlanLimit(userId, "aiRequestsPerMonth");

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const requestsLimit = quotaLimit.limit;

  await prisma.aIMonthlyQuota.upsert({
    where: {
      userId_month_year: { userId, month, year },
    },
    update: {
      requestsUsed: { increment: 1 },
    },
    create: {
      userId,
      month,
      year,
      requestsUsed: 1,
      requestsLimit,
    },
  });

  const quota = await prisma.aIMonthlyQuota.findUnique({
    where: {
      userId_month_year: { userId, month, year },
    },
  });

  if (quota) {
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
        link: `/app/profiles`,
      });
    }
  }
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
