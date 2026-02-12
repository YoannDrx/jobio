import { getPlanLimits } from "@/lib/auth/stripe/auth-plans";
import { ApplicationError } from "@/lib/errors/application-error";
import { STALE_ELIGIBLE_STATUS_VALUES } from "@/features/missions/mission-status";
import { prisma } from "@/lib/prisma";

type LimitFeature =
  | "missions"
  | "profiles"
  | "contacts"
  | "platforms"
  | "companies"
  | "aiRequestsPerMonth";

async function getUserPlanLimits(userId: string) {
  const subscription = await prisma.subscription.findUnique({
    where: { referenceId: userId },
  });
  return getPlanLimits(subscription?.plan);
}

export async function checkPlanLimit(
  userId: string,
  feature: LimitFeature,
): Promise<{
  allowed: boolean;
  used: number;
  limit: number;
  remaining: number;
}> {
  const limits = await getUserPlanLimits(userId);
  const limit = limits[feature];

  let used: number;

  switch (feature) {
    case "missions":
      used = await prisma.mission.count({
        where: {
          userId,
          deletedAt: null,
          status: { in: [...STALE_ELIGIBLE_STATUS_VALUES] },
        },
      });
      break;
    case "profiles":
      used = await prisma.userProfile.count({ where: { userId } });
      break;
    case "contacts":
      used = await prisma.contact.count({
        where: { userId, deletedAt: null },
      });
      break;
    case "platforms":
      used = await prisma.userPlatform.count({ where: { userId } });
      break;
    case "companies":
      used = await prisma.targetCompany.count({ where: { userId } });
      break;
    case "aiRequestsPerMonth": {
      const now = new Date();
      const quota = await prisma.aIMonthlyQuota.findUnique({
        where: {
          userId_month_year: {
            userId,
            month: now.getMonth() + 1,
            year: now.getFullYear(),
          },
        },
      });
      used = quota?.requestsUsed ?? 0;
      break;
    }
    default:
      throw new ApplicationError(`Unknown feature: ${feature}`);
  }

  return {
    allowed: used < limit,
    used,
    limit,
    remaining: Math.max(0, limit - used),
  };
}

export async function enforcePlanLimit(
  userId: string,
  feature: LimitFeature,
): Promise<void> {
  const result = await checkPlanLimit(userId, feature);
  if (!result.allowed) {
    throw new ApplicationError(
      `Limite atteinte : ${result.used}/${result.limit} ${feature}. Passe en Pro pour débloquer.`,
    );
  }
}
