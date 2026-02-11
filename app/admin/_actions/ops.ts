"use server";

import { Prisma } from "@/generated/prisma";
import { authAction } from "@/lib/actions/safe-actions";
import { ApplicationError } from "@/lib/errors/application-error";
import { getFeatureFlags, DEFAULT_FEATURE_FLAGS } from "@/lib/ops/feature-flags";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { createAdminAuditLog } from "./admin-audit";

const isMissingFeatureFlagsTable = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021";

const isMissingCronRunsTable = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021";

const isMissingSystemErrorsTable = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021";

export const getCronJobRuns = async (limit = 25) => {
  try {
    return await prisma.cronJobRun.findMany({
      orderBy: { startedAt: "desc" },
      take: limit,
    });
  } catch (error) {
    if (isMissingCronRunsTable(error)) {
      return [];
    }
    throw error;
  }
};

export const getOpsIncidentSummary = async () => {
  try {
    const [openErrors, criticalOpenErrors] = await Promise.all([
      prisma.systemErrorLog.count({
        where: {
          resolvedAt: null,
        },
      }),
      prisma.systemErrorLog.count({
        where: {
          resolvedAt: null,
          severity: "CRITICAL",
        },
      }),
    ]);

    return { openErrors, criticalOpenErrors };
  } catch (error) {
    if (isMissingSystemErrorsTable(error)) {
      return { openErrors: 0, criticalOpenErrors: 0 };
    }
    throw error;
  }
};

const updateFeatureFlagSchema = z.object({
  key: z.string().min(2).max(120),
  enabled: z.boolean(),
});

export const updateFeatureFlagAction = authAction
  .inputSchema(updateFeatureFlagSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    if (user.role !== "admin") {
      throw new ApplicationError("Accès administrateur requis");
    }

    const defaultFlag = DEFAULT_FEATURE_FLAGS.find(
      (flag) => flag.key === parsedInput.key,
    );

    if (!defaultFlag) {
      throw new ApplicationError("Feature flag inconnu");
    }

    try {
      await prisma.featureFlag.upsert({
        where: { key: parsedInput.key },
        update: {
          enabled: parsedInput.enabled,
          updatedByUserId: user.id,
          label: defaultFlag.label,
          description: defaultFlag.description,
          scope: defaultFlag.scope,
        },
        create: {
          key: parsedInput.key,
          enabled: parsedInput.enabled,
          updatedByUserId: user.id,
          label: defaultFlag.label,
          description: defaultFlag.description,
          scope: defaultFlag.scope,
        },
      });
    } catch (error) {
      if (isMissingFeatureFlagsTable(error)) {
        throw new ApplicationError(
          "La table de feature flags n'est pas encore disponible",
        );
      }
      throw error;
    }

    await createAdminAuditLog({
      action: "FEATURE_FLAG_UPDATED",
      actorUserId: user.id,
      actorEmail: user.email,
      metadata: {
        key: parsedInput.key,
        enabled: parsedInput.enabled,
      },
    });

    return { success: true };
  });

const syncFeatureFlagsSchema = z.object({});

export const syncDefaultFeatureFlagsAction = authAction
  .inputSchema(syncFeatureFlagsSchema)
  .action(async ({ ctx: { user } }) => {
    if (user.role !== "admin") {
      throw new ApplicationError("Accès administrateur requis");
    }

    try {
      await Promise.all(
        DEFAULT_FEATURE_FLAGS.map(async (flag) =>
          prisma.featureFlag.upsert({
            where: { key: flag.key },
            update: {
              label: flag.label,
              description: flag.description,
              scope: flag.scope,
            },
            create: {
              key: flag.key,
              label: flag.label,
              description: flag.description,
              scope: flag.scope,
              enabled: flag.enabled,
              updatedByUserId: user.id,
            },
          }),
        ),
      );
    } catch (error) {
      if (isMissingFeatureFlagsTable(error)) {
        throw new ApplicationError(
          "La table de feature flags n'est pas encore disponible",
        );
      }
      throw error;
    }

    await createAdminAuditLog({
      action: "FEATURE_FLAGS_SYNCED",
      actorUserId: user.id,
      actorEmail: user.email,
      metadata: {
        totalFlags: DEFAULT_FEATURE_FLAGS.length,
      },
    });

    return { success: true, total: DEFAULT_FEATURE_FLAGS.length };
  });

export const getAdminFeatureFlags = async () => {
  return getFeatureFlags();
};
