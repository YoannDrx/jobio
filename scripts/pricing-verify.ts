/* eslint-disable no-console */
import "dotenv/config";
import { Prisma, PrismaClient } from "@/generated/prisma";
import {
  AUTH_PLANS,
  PLAN_LIMIT_KEYS,
  getPlanLimits,
  type PlanLimit,
} from "@/lib/auth/stripe/auth-plans";
import Stripe from "stripe";

type Severity = "error" | "warning" | "info";

type VerificationIssue = {
  severity: Severity;
  check: string;
  message: string;
};

type PlanName = "free" | "pro" | "ultra";

const PLAN_NAMES: PlanName[] = ["free", "pro", "ultra"];

const args = new Set(process.argv.slice(2));
const strictMode = args.has("--strict");
const outputJson = args.has("--json");
const skipStripe = args.has("--skip-stripe");
const skipDb = args.has("--skip-db");

const issues: VerificationIssue[] = [];

const pushIssue = (
  severity: Severity,
  check: string,
  message: string,
): void => {
  issues.push({
    severity,
    check,
    message,
  });
};

const findPlan = (planName: PlanName) => AUTH_PLANS.find((plan) => plan.name === planName);

const isMissingPlanEntitlementsTables = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021";

const formatSummary = () => {
  const errors = issues.filter((item) => item.severity === "error");
  const warnings = issues.filter((item) => item.severity === "warning");
  const infos = issues.filter((item) => item.severity === "info");

  return {
    errors: errors.length,
    warnings: warnings.length,
    infos: infos.length,
  };
};

const hasFailingStatus = () => {
  const summary = formatSummary();
  if (summary.errors > 0) return true;
  if (strictMode && summary.warnings > 0) return true;
  return false;
};

const getExpectedLimits = (planName: PlanName): PlanLimit => getPlanLimits(planName);

async function verifyStaticPlanDefinitions() {
  for (const planName of PLAN_NAMES) {
    const plan = findPlan(planName);
    if (!plan) {
      pushIssue("error", "plans.static", `Plan manquant dans AUTH_PLANS: ${planName}`);
      continue;
    }

    if (planName === "free") {
      if (plan.price !== 0) {
        pushIssue(
          "error",
          "plans.static",
          `Le plan free doit rester à 0 (actuel: ${plan.price})`,
        );
      }
      continue;
    }

    if (!plan.priceId) {
      pushIssue(
        "error",
        "plans.static",
        `priceId manquant pour le plan ${planName} (env attendu)`,
      );
    }

    if (!plan.annualDiscountPriceId) {
      pushIssue(
        "error",
        "plans.static",
        `annualDiscountPriceId manquant pour le plan ${planName}`,
      );
    }

    if (!plan.yearlyPrice || plan.yearlyPrice <= 0) {
      pushIssue(
        "error",
        "plans.static",
        `yearlyPrice invalide pour le plan ${planName}`,
      );
    }
  }

  pushIssue("info", "plans.static", "Vérification des définitions statiques terminée");
}

async function verifyDbEntitlements() {
  if (skipDb) {
    pushIssue("info", "entitlements.db", "Vérification DB ignorée (--skip-db)");
    return;
  }

  if (!process.env.DATABASE_URL) {
    pushIssue(
      "warning",
      "entitlements.db",
      "DATABASE_URL absent: vérification DB ignorée",
    );
    return;
  }

  const prisma = new PrismaClient();

  try {
    const releases = await prisma.planEntitlementRelease.findMany({
      where: {
        plan: {
          in: [...PLAN_NAMES],
        },
      },
    });

    const activeRowsByPlan = await Promise.all(
      PLAN_NAMES.map(async (planName) => {
        const release = releases.find((item) => item.plan === planName);
        if (!release) {
          return {
            planName,
            release: null,
            activeRows: [],
          };
        }

        const activeRows = await prisma.planEntitlement.findMany({
          where: {
            plan: planName,
            version: release.activeVersion,
            isActive: true,
          },
          select: {
            featureKey: true,
            value: true,
          },
        });

        return {
          planName,
          release,
          activeRows,
        };
      }),
    );

    for (const item of activeRowsByPlan) {
      const { planName, release, activeRows } = item;
      if (!release) {
        pushIssue(
          "error",
          "entitlements.db",
          `Release active manquante pour ${planName}`,
        );
        continue;
      }

      const expected = getExpectedLimits(planName);
      const byFeature = new Map(activeRows.map((row) => [row.featureKey, row.value]));

      for (const featureKey of PLAN_LIMIT_KEYS) {
        if (!byFeature.has(featureKey)) {
          pushIssue(
            "error",
            "entitlements.db",
            `${planName} v${release.activeVersion}: feature manquante ${featureKey}`,
          );
          continue;
        }

        const dbValue = byFeature.get(featureKey);
        const staticValue = expected[featureKey];
        if (dbValue !== staticValue) {
          pushIssue(
            "warning",
            "entitlements.db",
            `${planName} v${release.activeVersion}: drift ${featureKey} DB=${dbValue} static=${staticValue}`,
          );
        }
      }

      for (const row of activeRows) {
        if (!PLAN_LIMIT_KEYS.includes(row.featureKey as keyof PlanLimit)) {
          pushIssue(
            "warning",
            "entitlements.db",
            `${planName} v${release.activeVersion}: feature inconnue ${row.featureKey}`,
          );
        }
      }
    }

    pushIssue("info", "entitlements.db", "Vérification entitlements DB terminée");
  } catch (error) {
    if (isMissingPlanEntitlementsTables(error)) {
      pushIssue(
        "warning",
        "entitlements.db",
        "Tables plan_entitlement absentes (migration non déployée)",
      );
      return;
    }

    pushIssue(
      "error",
      "entitlements.db",
      `Erreur inattendue: ${error instanceof Error ? error.message : "unknown error"}`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

type PriceCheck = {
  id: string;
  planName: PlanName;
  billing: "monthly" | "yearly";
  expectedAmount: number;
  currency: string;
};

const getPriceChecks = (): PriceCheck[] => {
  const checks: PriceCheck[] = [];

  for (const planName of PLAN_NAMES) {
    if (planName === "free") continue;
    const plan = findPlan(planName);
    if (!plan) continue;

    if (plan.priceId) {
      checks.push({
        id: plan.priceId,
        planName,
        billing: "monthly",
        expectedAmount: Math.round(plan.price * 100),
        currency: plan.currency.toLowerCase(),
      });
    }

    if (plan.annualDiscountPriceId && plan.yearlyPrice) {
      checks.push({
        id: plan.annualDiscountPriceId,
        planName,
        billing: "yearly",
        expectedAmount: Math.round(plan.yearlyPrice * 100),
        currency: plan.currency.toLowerCase(),
      });
    }
  }

  return checks;
};

async function verifyStripePrices() {
  if (skipStripe) {
    pushIssue("info", "stripe.live", "Vérification Stripe ignorée (--skip-stripe)");
    return;
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    pushIssue(
      "warning",
      "stripe.live",
      "STRIPE_SECRET_KEY absent: vérification Stripe ignorée",
    );
    return;
  }

  const stripe = new Stripe(stripeKey, {
    typescript: true,
  });

  const checks = getPriceChecks();

  const priceResults = await Promise.all(
    checks.map(async (check) => {
      try {
        const price = await stripe.prices.retrieve(check.id);
        return {
          check,
          price,
          error: null,
        } as const;
      } catch (error) {
        return {
          check,
          price: null,
          error,
        } as const;
      }
    }),
  );

  for (const result of priceResults) {
    const { check, price, error } = result;
    if (error) {
      pushIssue(
        "error",
        "stripe.live",
        `${check.planName} ${check.billing}: impossible de lire ${check.id} (${error instanceof Error ? error.message : "unknown error"})`,
      );
      continue;
    }

    if (!price) {
      pushIssue(
        "error",
        "stripe.live",
        `${check.planName} ${check.billing}: prix introuvable ${check.id}`,
      );
      continue;
    }

    try {
      const expectedInterval = check.billing === "monthly" ? "month" : "year";

      if (!price.active) {
        pushIssue(
          "warning",
          "stripe.live",
          `${check.planName} ${check.billing}: price ${check.id} inactif`,
        );
      }

      if (price.unit_amount !== check.expectedAmount) {
        pushIssue(
          "error",
          "stripe.live",
          `${check.planName} ${check.billing}: montant inattendu (${price.unit_amount} vs ${check.expectedAmount})`,
        );
      }

      if (price.currency !== check.currency) {
        pushIssue(
          "error",
          "stripe.live",
          `${check.planName} ${check.billing}: devise inattendue (${price.currency} vs ${check.currency})`,
        );
      }

      if (price.recurring?.interval !== expectedInterval) {
        pushIssue(
          "error",
          "stripe.live",
          `${check.planName} ${check.billing}: intervalle inattendu (${price.recurring?.interval ?? "none"} vs ${expectedInterval})`,
        );
      }

      const metadataPlan = price.metadata.plan;
      const metadataBilling = price.metadata.billing;
      if (!metadataPlan || metadataPlan !== check.planName) {
        pushIssue(
          "warning",
          "stripe.live",
          `${check.id}: metadata.plan absent/invalide (${metadataPlan || "absent"})`,
        );
      }
      if (
        !metadataBilling ||
        (check.billing === "monthly" && metadataBilling !== "monthly") ||
        (check.billing === "yearly" && metadataBilling !== "yearly")
      ) {
        pushIssue(
          "warning",
          "stripe.live",
          `${check.id}: metadata.billing absent/invalide (${metadataBilling || "absent"})`,
        );
      }
    } catch (error) {
      pushIssue(
        "error",
        "stripe.live",
        `${check.planName} ${check.billing}: impossible de lire ${check.id} (${error instanceof Error ? error.message : "unknown error"})`,
      );
    }
  }

  pushIssue("info", "stripe.live", "Vérification Stripe terminée");
}

async function run() {
  await verifyStaticPlanDefinitions();
  await verifyDbEntitlements();
  await verifyStripePrices();

  const summary = formatSummary();

  if (outputJson) {
    console.log(
      JSON.stringify(
        {
          summary,
          strictMode,
          issues,
        },
        null,
        2,
      ),
    );
  } else {
    for (const issue of issues) {
      const prefix =
        issue.severity === "error"
          ? "ERROR"
          : issue.severity === "warning"
            ? "WARN"
            : "INFO";
      console.log(`[${prefix}] [${issue.check}] ${issue.message}`);
    }

    console.log(
      `pricing:verify summary -> errors=${summary.errors}, warnings=${summary.warnings}, infos=${summary.infos}, strict=${strictMode}`,
    );
  }

  process.exit(hasFailingStatus() ? 1 : 0);
}

void run();
