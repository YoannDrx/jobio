import type { PlanEntitlement } from "@/generated/prisma";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { initializeProTrialForUser, markProTrialConsumed } from "./pro-trial";
import {
  PLAN_LIMIT_KEYS,
  getPlanLimits,
  type OverrideLimits,
  type PlanLimit,
} from "./auth-plans";

type EntitlementRow = Pick<PlanEntitlement, "featureKey" | "value">;

export type PlanEntitlementsSource = "static" | "database";

export type PlanLimitsResolution = {
  plan: string;
  limits: PlanLimit;
  source: PlanEntitlementsSource;
  version: number | null;
};

export type UserPlanAccessSource = "free" | "trial" | "stripe";

export type UserPlanLimitsResolution = Omit<PlanLimitsResolution, "source"> & {
  source: UserPlanAccessSource;
  entitlementSource: PlanEntitlementsSource;
  trialEndsAt: Date | null;
};

const PLAN_LIMIT_KEY_SET = new Set<string>(PLAN_LIMIT_KEYS);

const sanitizeLimitValue = (value: number): number =>
  Math.max(0, Math.trunc(value));

const applyOverrides = (
  baseLimits: PlanLimit,
  ...overrides: (OverrideLimits | null | undefined)[]
): PlanLimit => {
  const merged: PlanLimit = { ...baseLimits };

  for (const override of overrides) {
    if (!override) continue;
    for (const key of PLAN_LIMIT_KEYS) {
      const value = override[key];
      if (typeof value !== "number" || Number.isNaN(value)) {
        continue;
      }
      merged[key] = sanitizeLimitValue(value);
    }
  }

  return merged;
};

const isDbEntitlementsEnabled = (): boolean =>
  process.env.PLAN_ENTITLEMENTS_DB_ENABLED !== "false";

export const parsePlanEntitlementOverrides = (
  rows: EntitlementRow[],
): { overrides: OverrideLimits; ignoredFeatureKeys: string[] } => {
  const overrides: OverrideLimits = {};
  const ignoredFeatureKeys: string[] = [];

  for (const row of rows) {
    if (!PLAN_LIMIT_KEY_SET.has(row.featureKey)) {
      ignoredFeatureKeys.push(row.featureKey);
      continue;
    }
    if (!Number.isFinite(row.value)) {
      ignoredFeatureKeys.push(row.featureKey);
      continue;
    }

    overrides[row.featureKey as keyof PlanLimit] = sanitizeLimitValue(
      row.value,
    );
  }

  return {
    overrides,
    ignoredFeatureKeys,
  };
};

export const resolvePlanLimitsForPlan = async (
  plan = "free",
  overrideLimits?: OverrideLimits | null,
): Promise<PlanLimitsResolution> => {
  const resolvedPlan = plan || "free";
  const staticLimits = getPlanLimits(resolvedPlan);

  if (!isDbEntitlementsEnabled()) {
    return {
      plan: resolvedPlan,
      limits: applyOverrides(staticLimits, overrideLimits),
      source: "static",
      version: null,
    };
  }

  try {
    const release = await prisma.planEntitlementRelease.findUnique({
      where: { plan: resolvedPlan },
      select: { activeVersion: true },
    });

    if (!release) {
      return {
        plan: resolvedPlan,
        limits: applyOverrides(staticLimits, overrideLimits),
        source: "static",
        version: null,
      };
    }

    const rows = await prisma.planEntitlement.findMany({
      where: {
        plan: resolvedPlan,
        version: release.activeVersion,
        isActive: true,
      },
      select: {
        featureKey: true,
        value: true,
      },
    });

    const { overrides, ignoredFeatureKeys } =
      parsePlanEntitlementOverrides(rows);

    if (ignoredFeatureKeys.length > 0) {
      logger.warn(
        `Ignored ${ignoredFeatureKeys.length} invalid plan entitlement keys for plan=${resolvedPlan} version=${release.activeVersion}: ${ignoredFeatureKeys.join(", ")}`,
      );
    }

    if (Object.keys(overrides).length === 0) {
      return {
        plan: resolvedPlan,
        limits: applyOverrides(staticLimits, overrideLimits),
        source: "static",
        version: release.activeVersion,
      };
    }

    return {
      plan: resolvedPlan,
      limits: applyOverrides(staticLimits, overrides, overrideLimits),
      source: "database",
      version: release.activeVersion,
    };
  } catch (error) {
    logger.warn(
      `Failed to resolve DB entitlements for plan=${resolvedPlan}. Falling back to static limits.`,
      error,
    );
    return {
      plan: resolvedPlan,
      limits: applyOverrides(staticLimits, overrideLimits),
      source: "static",
      version: null,
    };
  }
};

export const resolvePlanLimitsForUser = async (
  userId: string,
  overrideLimits?: OverrideLimits | null,
): Promise<UserPlanLimitsResolution> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      preference: {
        select: {
          proTrialStartedAt: true,
          proTrialEndsAt: true,
          proTrialConsumedAt: true,
        },
      },
      subscription: {
        select: { plan: true, status: true },
      },
    },
  });

  if (!user) {
    const resolution = await resolvePlanLimitsForPlan("free", overrideLimits);
    const { source: entitlementSource, ...rest } = resolution;
    return {
      ...rest,
      source: "free",
      entitlementSource,
      trialEndsAt: null,
    };
  }

  const subscription = user.subscription;
  const hasPaidAccess =
    subscription?.status === "active" || subscription?.status === "past_due";

  let accessPlan = hasPaidAccess ? subscription.plan : "free";
  let accessSource: UserPlanAccessSource = hasPaidAccess ? "stripe" : "free";
  let trialEndsAt = user.preference?.proTrialEndsAt ?? null;

  if (!hasPaidAccess) {
    let trialPreference = user.preference;
    if (!trialPreference) {
      const initialized = await initializeProTrialForUser({
        userId,
        email: user.email,
      });
      trialPreference = {
        proTrialStartedAt: initialized.startedAt,
        proTrialEndsAt: initialized.endsAt,
        proTrialConsumedAt: initialized.granted ? null : new Date(),
      };
      trialEndsAt = initialized.endsAt;
    }

    const now = new Date();
    const trialIsActive =
      !trialPreference.proTrialConsumedAt &&
      Boolean(trialPreference.proTrialStartedAt) &&
      Boolean(trialPreference.proTrialEndsAt) &&
      (trialPreference.proTrialEndsAt?.getTime() ?? 0) > now.getTime();

    if (trialIsActive) {
      accessPlan = "pro";
      accessSource = "trial";
    } else if (
      trialPreference.proTrialEndsAt &&
      !trialPreference.proTrialConsumedAt
    ) {
      await markProTrialConsumed({
        userId,
        email: user.email,
        consumedAt: now,
      });
    }
  }

  const resolution = await resolvePlanLimitsForPlan(accessPlan, overrideLimits);
  const { source: entitlementSource, ...rest } = resolution;
  return {
    ...rest,
    source: accessSource,
    entitlementSource,
    trialEndsAt,
  };
};

export const getPlanLimitsForPlan = async (
  plan = "free",
  overrideLimits?: OverrideLimits | null,
): Promise<PlanLimit> => {
  const result = await resolvePlanLimitsForPlan(plan, overrideLimits);
  return result.limits;
};

export const getPlanLimitsForUser = async (
  userId: string,
  overrideLimits?: OverrideLimits | null,
): Promise<PlanLimit> => {
  const result = await resolvePlanLimitsForUser(userId, overrideLimits);
  return result.limits;
};
