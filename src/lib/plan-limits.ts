import { PricingFunnelEventType } from "@/generated/prisma";
import type { PlanLimit } from "@/lib/auth/stripe/auth-plans";
import {
  getPlanLimitsForPlan,
  resolvePlanLimitsForUser,
} from "@/lib/auth/stripe/plan-entitlements";
import { ApplicationError } from "@/lib/errors/application-error";
import { getPlanUpgradeLabel, getUpgradeMessage } from "@/lib/plan-limit-copy";
import { STALE_ELIGIBLE_STATUS_VALUES } from "@/features/missions/mission-status";
import { capturePricingFunnelEvent } from "@/lib/pricing/pricing-funnel-events";
import { prisma } from "@/lib/prisma";

type LimitFeature =
  | "missions"
  | "profiles"
  | "contacts"
  | "platforms"
  | "companies"
  | "billingClients"
  | "billingQuotes"
  | "billingInvoices"
  | "billingCatalogItems"
  | "billingRecurringInvoices"
  | "aiRequestsPerMonth"
  | "cvDocuments"
  | "sequences"
  | "messageTemplates";

type BooleanFeature =
  | "cvTemplatesAll"
  | "cvCoachAI"
  | "atsScoring"
  | "autoFollowUps"
  | "csvExport"
  | "aiEmailGeneration"
  | "aiLinkedinAudit"
  | "opportunityDiscovery";

const LIMIT_FEATURE_LABELS: Record<LimitFeature, string> = {
  missions: "missions actives",
  profiles: "profils",
  contacts: "contacts",
  platforms: "plateformes",
  companies: "entreprises",
  billingClients: "clients facturation",
  billingQuotes: "devis",
  billingInvoices: "factures",
  billingCatalogItems: "éléments de catalogue",
  billingRecurringInvoices: "factures récurrentes",
  aiRequestsPerMonth: "requêtes IA/mois",
  cvDocuments: "documents CV",
  sequences: "séquences",
  messageTemplates: "templates messages",
};

const BOOLEAN_FEATURE_LABELS: Record<BooleanFeature, string> = {
  cvTemplatesAll: "tous les templates CV",
  cvCoachAI: "CV Coach IA",
  atsScoring: "ATS Scoring",
  autoFollowUps: "relances automatiques",
  csvExport: "export CSV",
  aiEmailGeneration: "génération emails IA",
  aiLinkedinAudit: "LinkedIn Audit IA",
  opportunityDiscovery: "Radar Missions IA",
};

async function getUserPlanInfo(userId: string) {
  const resolvedPlan = await resolvePlanLimitsForUser(userId);
  return {
    plan: resolvedPlan.plan,
    limits: resolvedPlan.limits,
  };
}

type PlanResolution = {
  plan?: string;
  limits?: PlanLimit;
};

const resolvePlanInfo = async (
  userId: string,
  resolution?: PlanResolution,
): Promise<{ plan: string; limits: PlanLimit }> => {
  if (resolution?.plan || resolution?.limits) {
    const resolvedPlan = resolution.plan ?? "free";
    return {
      plan: resolvedPlan,
      limits: resolution.limits ?? (await getPlanLimitsForPlan(resolvedPlan)),
    };
  }

  return getUserPlanInfo(userId);
};

export async function checkPlanLimit(
  userId: string,
  feature: LimitFeature,
  resolution?: PlanResolution,
): Promise<{
  plan: string;
  allowed: boolean;
  used: number;
  limit: number;
  remaining: number;
}> {
  const { plan, limits } = await resolvePlanInfo(userId, resolution);
  const limit = limits[feature as keyof PlanLimit];

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
    case "billingClients":
      used = await prisma.billingClient.count({
        where: {
          userId,
          deletedAt: null,
        },
      });
      break;
    case "billingQuotes":
      used = await prisma.billingQuote.count({
        where: {
          userId,
          deletedAt: null,
        },
      });
      break;
    case "billingInvoices":
      used = await prisma.billingInvoice.count({
        where: {
          userId,
          deletedAt: null,
        },
      });
      break;
    case "billingCatalogItems":
      used = await prisma.billingCatalogItem.count({
        where: {
          userId,
        },
      });
      break;
    case "billingRecurringInvoices":
      used = await prisma.billingRecurringInvoice.count({
        where: { userId },
      });
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
    case "cvDocuments":
      used = await prisma.cvLabDocument.count({
        where: { userId, archivedAt: null },
      });
      break;
    case "sequences":
      used = await prisma.sequence.count({
        where: { userId },
      });
      break;
    case "messageTemplates":
      used = await prisma.messageTemplate.count({
        where: { userId, isSystem: false },
      });
      break;
    default:
      throw new ApplicationError(`Unknown feature: ${feature}`);
  }

  return {
    plan,
    allowed: used < limit,
    used,
    limit,
    remaining: Math.max(0, limit - used),
  };
}

export async function enforcePlanLimit(
  userId: string,
  feature: LimitFeature,
  resolution?: PlanResolution,
): Promise<{
  plan: string;
  allowed: boolean;
  used: number;
  limit: number;
  remaining: number;
}> {
  const result = await checkPlanLimit(userId, feature, resolution);
  if (!result.allowed) {
    const featureLabel = LIMIT_FEATURE_LABELS[feature];
    const upgrade = getUpgradeMessage(result.plan);
    const planTarget = getPlanUpgradeLabel(result.plan).toLowerCase();

    await capturePricingFunnelEvent({
      eventType: PricingFunnelEventType.PAYWALL_HIT,
      userId,
      planCurrent: result.plan,
      planTarget: planTarget || result.plan,
      featureKey: feature,
      entryPoint: "server_enforce_limit",
      metadata: {
        used: result.used,
        limit: result.limit,
      },
    });

    throw new ApplicationError(
      `Limite atteinte : ${result.used}/${result.limit} ${featureLabel}. ${upgrade}.`,
    );
  }

  return result;
}

export async function checkPlanFeature(
  userId: string,
  feature: BooleanFeature,
): Promise<boolean> {
  const { limits } = await getUserPlanInfo(userId);
  return limits[feature] >= 1;
}

export async function enforcePlanFeature(
  userId: string,
  feature: BooleanFeature,
): Promise<void> {
  const { plan, limits } = await getUserPlanInfo(userId);
  if (limits[feature] < 1) {
    const featureLabel = BOOLEAN_FEATURE_LABELS[feature];
    const upgrade = getUpgradeMessage(plan);
    const planTarget = getPlanUpgradeLabel(plan).toLowerCase();

    await capturePricingFunnelEvent({
      eventType: PricingFunnelEventType.PAYWALL_HIT,
      userId,
      planCurrent: plan,
      planTarget: planTarget || plan,
      featureKey: feature,
      entryPoint: "server_enforce_feature",
    });

    throw new ApplicationError(
      `Fonctionnalité non disponible : ${featureLabel}. ${upgrade}.`,
    );
  }
}
