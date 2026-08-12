/* eslint-disable no-console */
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { PRODUCT_FEATURES } from "../src/config/product-features";
import {
  JOBIO_PRO_PRODUCT,
  LINKEDIN_PROGRAM_PRODUCTS,
  PROGRAM_PRICE,
} from "../src/lib/stripe/billing-catalog";

const args = new Set(process.argv.slice(2));
const validateEnvironment = !args.has("--static");
const live = args.has("--live");
const release = args.has("--release");
const errors: string[] = [];
const successes: string[] = [];
const projectRoot = fileURLToPath(new URL("..", import.meta.url));

const expect = (condition: boolean, message: string) => {
  if (condition) successes.push(message);
  else errors.push(message);
};

// `vercel env pull` intentionally replaces Sensitive values with this marker.
// Their real length can only be checked inside the deployment runtime. Treat
// the marker as configured so a read-only audit does not report a false P0.
const hasMinimumSecretLength = (value: string | undefined, minimum: number) =>
  value?.toLowerCase() === "[sensitive]" || (value?.length ?? 0) >= minimum;

const requiredEnvironment = [
  "DATABASE_URL",
  "REDIS_URL",
  "BETTER_AUTH_URL",
  "BETTER_AUTH_SECRET",
  "RESEND_API_KEY",
  "RESEND_WEBHOOK_SECRET",
  "EMAIL_FROM",
  "STRIPE_SECRET_KEY",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_JOBIO_PORTAL_CONFIGURATION_ID",
  "STRIPE_PRO_PLAN_ID",
  "STRIPE_PRO_YEARLY_PLAN_ID",
  "STRIPE_PROGRAM_ATTIRER_PRICE_ID",
  "STRIPE_PROGRAM_BRANDING_PRICE_ID",
  "STRIPE_PROGRAM_CROISSANCE_PRICE_ID",
  "CRON_SECRET",
  "OPENAI_API_KEY",
  "VAPID_PUBLIC_KEY",
  "VAPID_PRIVATE_KEY",
  "VAPID_SUBJECT",
  "NEXT_PUBLIC_VAPID_PUBLIC_KEY",
  "LEGAL_BUSINESS_NAME",
  "LEGAL_FORM",
  "LEGAL_SIRET",
  "LEGAL_ADDRESS",
  "LEGAL_VAT_NOTICE",
] as const;

const validateEnv = () => {
  for (const name of requiredEnvironment) {
    expect(Boolean(process.env[name]?.trim()), `Variable ${name} renseignée`);
  }
  expect(
    process.env.BETTER_AUTH_URL === "https://jobio.fr",
    "BETTER_AUTH_URL utilise le domaine canonique https://jobio.fr",
  );
  expect(
    hasMinimumSecretLength(process.env.BETTER_AUTH_SECRET, 32),
    "BETTER_AUTH_SECRET contient au moins 32 caractères (ou est masqué par Vercel)",
  );
  expect(
    hasMinimumSecretLength(process.env.CRON_SECRET, 24),
    "CRON_SECRET contient au moins 24 caractères (ou est masqué par Vercel)",
  );
  if (live) {
    expect(
      process.env.STRIPE_SECRET_KEY?.startsWith("sk_live_") === true,
      "Stripe utilise une clé secrète live",
    );
    expect(
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.startsWith("pk_live_") ===
        true,
      "Stripe utilise une clé publique live",
    );
  }
};

const expectedPngs = {
  "public/images/og-jobio.png": [1200, 630],
  "public/images/icon-192.png": [192, 192],
  "public/images/icon-512.png": [512, 512],
  "public/images/stripe/jobio-pro.png": [1024, 1024],
  "public/images/stripe/linkedin-attirer-clients.png": [1024, 1024],
  "public/images/stripe/linkedin-personal-branding.png": [1024, 1024],
  "public/images/stripe/linkedin-croissance.png": [1024, 1024],
} as const;

const validatePng = async (path: string, width: number, height: number) => {
  const absolutePath = resolve(projectRoot, path);
  try {
    const [buffer, file] = await Promise.all([
      readFile(absolutePath),
      stat(absolutePath),
    ]);
    expect(
      buffer.subarray(0, 8).toString("hex") === "89504e470d0a1a0a",
      `${path} est un vrai PNG`,
    );
    expect(
      buffer.readUInt32BE(16) === width && buffer.readUInt32BE(20) === height,
      `${path} mesure ${width}×${height}`,
    );
    expect(file.size > 1_000, `${path} n’est pas vide`);
  } catch {
    errors.push(`${path} est absent ou illisible`);
  }
};

const validateStaticCatalog = () => {
  expect(
    Number(JOBIO_PRO_PRODUCT.prices.monthly.unitAmount) === 1900,
    "Pro mensuel = 19 € HT",
  );
  expect(
    Number(JOBIO_PRO_PRODUCT.prices.yearly.unitAmount) === 19000,
    "Pro annuel = 190 € HT",
  );
  expect(
    String(JOBIO_PRO_PRODUCT.prices.monthly.lookupKey) ===
      "jobio_pro_monthly_v1",
    "Lookup Pro mensuel versionné",
  );
  expect(
    String(JOBIO_PRO_PRODUCT.prices.yearly.lookupKey) === "jobio_pro_yearly_v1",
    "Lookup Pro annuel versionné",
  );
  expect(
    Number(PROGRAM_PRICE.unitAmount) === 3900,
    "Chaque programme payant = 39 € HT",
  );
  expect(
    Object.keys(LINKEDIN_PROGRAM_PRODUCTS).length === 3,
    "Trois programmes payants dans le catalogue",
  );
  expect(
    !JOBIO_PRO_PRODUCT.name.toLowerCase().includes("ultra"),
    "Aucun plan historique dans le catalogue courant",
  );
};

const validateReleaseStatus = () => {
  if (!release) return;
  const coreGaFeatures = [
    "today",
    "pipeline",
    "followUps",
    "cv",
    "contacts",
    "notifications",
    "profiles",
  ] as const;
  for (const feature of coreGaFeatures) {
    const definition = PRODUCT_FEATURES[feature];
    expect(
      String(definition.status) === "ga",
      `${feature} (cœur) est promu GA avec preuves attachées`,
    );
  }
  expect(
    String(PRODUCT_FEATURES.opportunityDiscovery.status) === "beta",
    "Radar Missions reste en bêta publique contrôlée",
  );
};

const validateEvidenceTimestamp = (name: string, maxAgeDays: number) => {
  const raw = process.env[name]?.trim();
  const timestamp = raw ? Date.parse(raw) : Number.NaN;
  const ageMs = Date.now() - timestamp;
  expect(
    Boolean(raw) &&
      Number.isFinite(timestamp) &&
      ageMs >= -5 * 60_000 &&
      ageMs <= maxAgeDays * 24 * 60 * 60 * 1000,
    `${name} est daté et a moins de ${maxAgeDays} jours`,
  );
};

const validateReleaseEvidence = () => {
  if (!release) return;
  validateEvidenceTimestamp("LEGAL_REVIEW_APPROVED_AT", 365);
  validateEvidenceTimestamp("PRIVACY_REVIEW_APPROVED_AT", 365);
  validateEvidenceTimestamp("ACCOUNTING_REVIEW_APPROVED_AT", 365);
  validateEvidenceTimestamp("SECURITY_REVIEW_APPROVED_AT", 90);
  validateEvidenceTimestamp("PITR_RESTORE_VERIFIED_AT", 90);
  validateEvidenceTimestamp("STRIPE_LIVE_SMOKE_VERIFIED_AT", 90);
  validateEvidenceTimestamp("MULTI_BROWSER_E2E_VERIFIED_AT", 30);
  validateEvidenceTimestamp("WEBHOOK_BACKLOG_VERIFIED_AT", 7);
  expect(
    Number(process.env.PITR_RETENTION_HOURS) >= 168,
    "Rétention PITR >= 168 heures",
  );
  expect(
    Number(process.env.MOBILE_LIGHTHOUSE_SCORE) >= 85,
    "Lighthouse mobile >= 85",
  );
};

const run = async () => {
  if (validateEnvironment) validateEnv();
  validateStaticCatalog();
  validateReleaseStatus();
  validateReleaseEvidence();
  await Promise.all(
    Object.entries(expectedPngs).map(async ([path, dimensions]) =>
      validatePng(path, dimensions[0], dimensions[1]),
    ),
  );

  for (const success of successes) console.log(`[OK] ${success}`);
  for (const error of errors) console.error(`[ERREUR] ${error}`);
  console.log(`Preflight: ${successes.length} OK, ${errors.length} erreur(s)`);

  process.exit(errors.length === 0 ? 0 : 1);
};

void run();
