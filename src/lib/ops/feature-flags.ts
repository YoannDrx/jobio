import { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";

type DefaultFeatureFlag = {
  key: string;
  label: string;
  description: string;
  enabled: boolean;
  scope: "global" | "admin";
};

export const DEFAULT_FEATURE_FLAGS: DefaultFeatureFlag[] = [
  {
    key: "assistant.batch_followups",
    label: "Assistant: relances batch",
    description:
      "Autorise la planification de relances en lot depuis la vue Today.",
    enabled: true,
    scope: "global",
  },
  {
    key: "assistant.ai_strategy",
    label: "Assistant: stratégie IA",
    description:
      "Active les recommandations prescriptives générées par IA dans Today.",
    enabled: true,
    scope: "global",
  },
  {
    key: "onboarding.extended_checklist",
    label: "Onboarding étendu",
    description:
      "Affiche la checklist activation avancée (contact, relance, premier envoi).",
    enabled: true,
    scope: "global",
  },
  {
    key: "admin.ops_dashboard",
    label: "Admin Ops Dashboard",
    description:
      "Expose la page Ops admin (health cron, incidents, feature flags).",
    enabled: true,
    scope: "admin",
  },
];

const isMissingFeatureFlagsTable = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021";

const byKey = new Map(DEFAULT_FEATURE_FLAGS.map((flag) => [flag.key, flag]));

export async function getFeatureFlags() {
  try {
    const rows = await prisma.featureFlag.findMany({
      orderBy: [{ scope: "asc" }, { key: "asc" }],
    });

    const fromDb = rows.map((row) => ({
      key: row.key,
      label: row.label,
      description: row.description ?? "",
      enabled: row.enabled,
      scope: row.scope as "global" | "admin",
      source: "db" as const,
      updatedAt: row.updatedAt,
      updatedByUserId: row.updatedByUserId,
    }));

    const missingDefaults = DEFAULT_FEATURE_FLAGS.filter(
      (flag) => !rows.some((row) => row.key === flag.key),
    ).map((flag) => ({
      ...flag,
      source: "default" as const,
      updatedAt: null,
      updatedByUserId: null,
    }));

    return [...fromDb, ...missingDefaults];
  } catch (error) {
    if (isMissingFeatureFlagsTable(error)) {
      return DEFAULT_FEATURE_FLAGS.map((flag) => ({
        ...flag,
        source: "default" as const,
        updatedAt: null,
        updatedByUserId: null,
      }));
    }
    throw error;
  }
}

export async function isFeatureEnabled(key: string) {
  const fallback = byKey.get(key)?.enabled ?? false;

  try {
    const flag = await prisma.featureFlag.findUnique({
      where: { key },
      select: { enabled: true },
    });
    return flag?.enabled ?? fallback;
  } catch (error) {
    if (isMissingFeatureFlagsTable(error)) {
      return fallback;
    }
    throw error;
  }
}

