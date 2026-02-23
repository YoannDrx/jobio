"use server";

import { Prisma } from "@/generated/prisma";
import { authAction } from "@/lib/actions/safe-actions";
import {
  PLAN_LIMIT_KEYS,
  getPlanLimits,
  type PlanLimit,
} from "@/lib/auth/stripe/auth-plans";
import { parsePlanEntitlementOverrides } from "@/lib/auth/stripe/plan-entitlements";
import { ApplicationError } from "@/lib/errors/application-error";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { createAdminAuditLog } from "./admin-audit";

const PLAN_NAMES = ["free", "pro", "ultra"] as const;
type PlanName = (typeof PLAN_NAMES)[number];

const isMissingPlanEntitlementsTable = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021";

const buildRowsFromLimits = (plan: PlanName, version: number, limits: PlanLimit) =>
  PLAN_LIMIT_KEYS.map((featureKey) => ({
    plan,
    version,
    featureKey,
    value: limits[featureKey],
    isActive: true,
  }));

export const getPlanEntitlementsOverview = async () => {
  try {
    const [releases, groupedRows] = await Promise.all([
      prisma.planEntitlementRelease.findMany({
        where: {
          plan: {
            in: [...PLAN_NAMES],
          },
        },
      }),
      prisma.planEntitlement.groupBy({
        by: ["plan", "version"],
        where: {
          plan: {
            in: [...PLAN_NAMES],
          },
        },
        _count: {
          _all: true,
        },
        _max: {
          updatedAt: true,
        },
      }),
    ]);

    const releaseByPlan = new Map(releases.map((release) => [release.plan, release]));

    const plans = PLAN_NAMES.map((plan) => {
      const release = releaseByPlan.get(plan);
      const activeVersion = release?.activeVersion ?? null;
      const versions = groupedRows
        .filter((row) => row.plan === plan)
        .sort((a, b) => b.version - a.version)
        .map((row) => ({
          version: row.version,
          rowCount: row._count._all,
          isActive: activeVersion === row.version,
          updatedAt: row._max.updatedAt,
        }));

      return {
        plan,
        activeVersion,
        versions,
      };
    });

    return {
      available: true as const,
      plans,
    };
  } catch (error) {
    if (isMissingPlanEntitlementsTable(error)) {
      return {
        available: false as const,
        plans: [],
        reason: "Tables plan_entitlement absentes (migration non déployée).",
      };
    }
    throw error;
  }
};

const createVersionSchema = z.object({
  plan: z.enum(PLAN_NAMES),
  source: z.enum(["active", "static"]).default("active"),
  activate: z.boolean().default(false),
});

export const createPlanEntitlementVersionAction = authAction
  .inputSchema(createVersionSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    if (user.role !== "admin") {
      throw new ApplicationError("Accès administrateur requis");
    }

    const { plan, source, activate } = parsedInput;

    try {
      const [release, maxVersionResult] = await Promise.all([
        prisma.planEntitlementRelease.findUnique({
          where: { plan },
          select: { activeVersion: true },
        }),
        prisma.planEntitlement.aggregate({
          where: { plan },
          _max: { version: true },
        }),
      ]);

      const nextVersion = (maxVersionResult._max.version ?? 0) + 1;
      let limits = getPlanLimits(plan);

      if (source === "active" && release?.activeVersion) {
        const sourceRows = await prisma.planEntitlement.findMany({
          where: {
            plan,
            version: release.activeVersion,
            isActive: true,
          },
          select: {
            featureKey: true,
            value: true,
          },
        });

        const { overrides } = parsePlanEntitlementOverrides(sourceRows);
        if (Object.keys(overrides).length > 0) {
          limits = getPlanLimits(plan, overrides);
        }
      }

      await prisma.$transaction(async (tx) => {
        await tx.planEntitlement.createMany({
          data: buildRowsFromLimits(plan, nextVersion, limits),
        });

        await tx.planEntitlementRelease.upsert({
          where: { plan },
          update: activate ? { activeVersion: nextVersion } : {},
          create: {
            plan,
            activeVersion: nextVersion,
          },
        });
      });

      await createAdminAuditLog({
        action: "PLAN_ENTITLEMENT_VERSION_CREATED",
        actorUserId: user.id,
        actorEmail: user.email,
        metadata: {
          plan,
          source,
          activate,
          nextVersion,
        },
      });

      return {
        success: true,
        plan,
        source,
        nextVersion,
        activated: activate,
      };
    } catch (error) {
      if (isMissingPlanEntitlementsTable(error)) {
        throw new ApplicationError(
          "Tables plan_entitlement absentes (migration non déployée).",
        );
      }
      throw error;
    }
  });

const activateVersionSchema = z.object({
  plan: z.enum(PLAN_NAMES),
  version: z.number().int().positive(),
});

export const activatePlanEntitlementVersionAction = authAction
  .inputSchema(activateVersionSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    if (user.role !== "admin") {
      throw new ApplicationError("Accès administrateur requis");
    }

    const { plan, version } = parsedInput;

    try {
      const rowsCount = await prisma.planEntitlement.count({
        where: {
          plan,
          version,
          isActive: true,
        },
      });

      if (rowsCount === 0) {
        throw new ApplicationError(
          `Impossible d'activer la version ${version} pour ${plan}: aucune règle trouvée.`,
        );
      }

      await prisma.planEntitlementRelease.upsert({
        where: { plan },
        update: {
          activeVersion: version,
        },
        create: {
          plan,
          activeVersion: version,
        },
      });

      await createAdminAuditLog({
        action: "PLAN_ENTITLEMENT_VERSION_ACTIVATED",
        actorUserId: user.id,
        actorEmail: user.email,
        metadata: {
          plan,
          version,
          rowsCount,
        },
      });

      return {
        success: true,
        plan,
        version,
      };
    } catch (error) {
      if (isMissingPlanEntitlementsTable(error)) {
        throw new ApplicationError(
          "Tables plan_entitlement absentes (migration non déployée).",
        );
      }
      throw error;
    }
  });
