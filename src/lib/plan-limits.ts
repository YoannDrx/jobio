import { getPlanLimits } from "@/lib/auth/stripe/auth-plans";
import type { PlanLimit } from "@/lib/auth/stripe/auth-plans";
import { ApplicationError } from "@/lib/errors/application-error";
import { STALE_ELIGIBLE_STATUS_VALUES } from "@/features/missions/mission-status";
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
  | "aiLinkedinAudit";

export function getPlanUpgradeLabel(plan: string): string {
  if (plan === "free") return "Pro";
  if (plan === "pro") return "Ultra";
  return "";
}

export function getPlanUpgradeButtonText(plan: string): string {
  if (plan === "free") return "Passer en Pro";
  if (plan === "pro") return "Passer en Ultra";
  return "Gérer l'abonnement";
}

export function getPlanLimitMessage(
  plan: string,
  isExhausted: boolean,
): string {
  if (plan === "ultra") return "Limite maximale atteinte";
  const action = isExhausted ? "continuer" : "en avoir plus";
  return `Passe en ${getPlanUpgradeLabel(plan)} pour ${action}.`;
}

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
};

async function getUserPlanInfo(userId: string) {
  const subscription = await prisma.subscription.findUnique({
    where: { referenceId: userId },
  });
  return {
    plan: subscription?.plan ?? "free",
    limits: getPlanLimits(subscription?.plan),
  };
}

export function getUpgradeMessage(plan: string): string {
  if (plan === "free") return "Passe en Pro pour débloquer";
  if (plan === "pro") return "Passe en Ultra pour débloquer";
  return "Limite maximale atteinte";
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
  const { limits } = await getUserPlanInfo(userId);
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
  const { plan } = await getUserPlanInfo(userId);
  const result = await checkPlanLimit(userId, feature);
  if (!result.allowed) {
    const featureLabel = LIMIT_FEATURE_LABELS[feature];
    const upgrade = getUpgradeMessage(plan);
    throw new ApplicationError(
      `Limite atteinte : ${result.used}/${result.limit} ${featureLabel}. ${upgrade}.`,
    );
  }
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
    throw new ApplicationError(
      `Fonctionnalité non disponible : ${featureLabel}. ${upgrade}.`,
    );
  }
}
