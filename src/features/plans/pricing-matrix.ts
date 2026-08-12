import { getPlanLimits } from "@/lib/auth/stripe/auth-plans";
import type { PlanLimit } from "@/lib/auth/stripe/auth-plans";

type PlanName = "free" | "pro";

export type PricingMatrixValue = string | boolean;

export type PricingMatrixFeature = {
  name: string;
  free: PricingMatrixValue;
  pro: PricingMatrixValue;
};

export type PricingMatrixCategory = {
  name: string;
  features: PricingMatrixFeature[];
};

const PLAN_NAMES: PlanName[] = ["free", "pro"];
const UNLIMITED_THRESHOLD = 999_999;

const SUPPORT_LABEL_BY_PLAN: Record<PlanName, string> = {
  free: "Communautaire",
  pro: "Email prioritaire",
};

const planLimitsByPlan = {
  free: getPlanLimits("free"),
  pro: getPlanLimits("pro"),
};

const isUnlimited = (value: number) => value >= UNLIMITED_THRESHOLD;

const asCount = (value: number): string =>
  isUnlimited(value) ? "Illimité" : value.toString();

const asBoolean = (value: number): boolean => value >= 1;

const asCvTemplate = (value: number): string =>
  value >= 1 ? "Tous" : "Classic";

const asAnalyticsHistory = (value: number): string =>
  isUnlimited(value) ? "Illimité" : `${value} jours`;

const asSupportType = (planName: PlanName): string =>
  SUPPORT_LABEL_BY_PLAN[planName];

const buildLimitFeature = (
  name: string,
  key: keyof PlanLimit,
  format: (value: number) => PricingMatrixValue = asCount,
): PricingMatrixFeature => ({
  name,
  free: format(planLimitsByPlan.free[key]),
  pro: format(planLimitsByPlan.pro[key]),
});

const buildPlanFeature = (
  name: string,
  format: (planName: PlanName) => PricingMatrixValue,
): PricingMatrixFeature =>
  PLAN_NAMES.reduce(
    (acc, planName) => ({
      ...acc,
      [planName]: format(planName),
    }),
    { name } as PricingMatrixFeature,
  );

export const PRICING_COMPARISON_CATEGORIES: PricingMatrixCategory[] = [
  {
    name: "Prospection",
    features: [
      buildLimitFeature("Missions", "missions"),
      buildLimitFeature("Profils", "profiles"),
      buildLimitFeature("Contacts", "contacts"),
      buildLimitFeature("Plateformes", "platforms"),
      buildLimitFeature("Entreprises", "companies"),
      buildLimitFeature(
        "Radar Missions automatisé",
        "opportunityDiscovery",
        asBoolean,
      ),
    ],
  },
  {
    name: "CV Lab",
    features: [
      buildLimitFeature("Documents CV", "cvDocuments"),
      buildLimitFeature("Templates", "cvTemplatesAll", asCvTemplate),
      buildLimitFeature("ATS Scoring", "atsScoring", asBoolean),
      buildLimitFeature("CV Coach IA", "cvCoachAI", asBoolean),
    ],
  },
  {
    name: "Automatisation",
    features: [
      buildLimitFeature("Relances auto", "autoFollowUps", asBoolean),
      buildLimitFeature("Séquences", "sequences"),
      buildLimitFeature("Templates messages", "messageTemplates"),
      buildLimitFeature("Export CSV", "csvExport", asBoolean),
    ],
  },
  {
    name: "Facturation",
    features: [
      buildLimitFeature("Clients", "billingClients"),
      buildLimitFeature("Devis", "billingQuotes"),
      buildLimitFeature("Factures", "billingInvoices"),
      buildLimitFeature("Catalogue", "billingCatalogItems"),
      buildLimitFeature("Factures récurrentes", "billingRecurringInvoices"),
    ],
  },
  {
    name: "Intelligence IA",
    features: [
      buildLimitFeature("Requêtes/mois", "aiRequestsPerMonth"),
      buildLimitFeature("Génération emails", "aiEmailGeneration", asBoolean),
      buildLimitFeature("LinkedIn Audit", "aiLinkedinAudit", asBoolean),
    ],
  },
  {
    name: "Analytics",
    features: [
      buildLimitFeature(
        "Historique",
        "analyticsHistoryDays",
        asAnalyticsHistory,
      ),
    ],
  },
  {
    name: "Support",
    features: [buildPlanFeature("Type", asSupportType)],
  },
];
