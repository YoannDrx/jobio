import { getPlanLimits } from "@/lib/auth/stripe/auth-plans";
import type { PlanLimit } from "@/lib/auth/stripe/auth-plans";

const PLAN_ORDER = ["free", "pro"] as const;
const UNLIMITED_THRESHOLD = 999_999;

type PlanName = (typeof PLAN_ORDER)[number];
type FeatureKey = keyof PlanLimit;

const planLimitsByPlan = {
  free: getPlanLimits("free"),
  pro: getPlanLimits("pro"),
} as const;

const SUPPORT_LABEL_BY_PLAN: Record<PlanName, string> = {
  free: "Communautaire",
  pro: "Email prioritaire",
};

export const getMinimumPlanForFeature = (feature: FeatureKey): PlanName => {
  for (const planName of PLAN_ORDER) {
    if (planLimitsByPlan[planName][feature] > 0) {
      return planName;
    }
  }

  return "pro";
};

export const getPlanAccessLabelForFeature = (
  feature: FeatureKey,
): string | null => {
  const minimumPlan = getMinimumPlanForFeature(feature);

  if (minimumPlan === "free") return null;
  return "Pro";
};

export const withPlanBadge = (label: string, feature: FeatureKey): string => {
  const badge = getPlanAccessLabelForFeature(feature);
  return badge ? `${label} (${badge})` : label;
};

export const formatPlanCount = (value: number): string =>
  value >= UNLIMITED_THRESHOLD ? "Illimité" : value.toLocaleString("fr-FR");

export const getPlanSupportLabel = (plan: PlanName): string =>
  SUPPORT_LABEL_BY_PLAN[plan];
