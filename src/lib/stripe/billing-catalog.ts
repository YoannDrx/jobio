export const BILLING_CATALOG_VERSION = 1;

export const JOBIO_PRO_PRODUCT = {
  sku: "jobio_pro",
  name: "Jobio Pro",
  description:
    "Le cockpit tout-en-un des freelances tech : prospection, CRM, CV IA, relances, analytics et gestion d’activité.",
  image: "jobio-pro.png",
  statementDescriptor: "JOBIO",
  prices: {
    monthly: {
      lookupKey: "jobio_pro_monthly_v1",
      unitAmount: 1900,
      currency: "eur",
      interval: "month",
    },
    yearly: {
      lookupKey: "jobio_pro_yearly_v1",
      unitAmount: 19000,
      currency: "eur",
      interval: "year",
    },
  },
  metadata: {
    app: "jobio",
    sku: "jobio_pro",
    plan: "pro",
    catalog_version: String(BILLING_CATALOG_VERSION),
  },
} as const;

export const LINKEDIN_PROGRAM_PRODUCTS = {
  "attirer-clients": {
    sku: "linkedin_attirer_clients_v1",
    name: "LinkedIn — Attirer des clients",
    description:
      "Des trames concrètes pour transformer ton expertise freelance en publications qui attirent des prospects qualifiés.",
    image: "linkedin-attirer-clients.png",
  },
  "personal-branding": {
    sku: "linkedin_personal_branding_v1",
    name: "LinkedIn — Personal branding",
    description:
      "Un programme actionnable pour construire une voix reconnaissable, crédible et régulière sur LinkedIn.",
    image: "linkedin-personal-branding.png",
  },
  "exploser-croissance": {
    sku: "linkedin_croissance_v1",
    name: "LinkedIn — Accélérer sa croissance",
    description:
      "Des formats avancés pour augmenter ta portée, consolider ton autorité et créer davantage d’opportunités.",
    image: "linkedin-croissance.png",
  },
} as const;

export type PaidProgramSlug = keyof typeof LINKEDIN_PROGRAM_PRODUCTS;

export const PROGRAM_PRICE = {
  unitAmount: 3900,
  currency: "eur",
  taxBehavior: "exclusive",
} as const;

export const isPaidProgramSlug = (slug: string): slug is PaidProgramSlug =>
  slug in LINKEDIN_PROGRAM_PRODUCTS;

export const PROGRAM_PRICE_ENV_KEYS = {
  "attirer-clients": "STRIPE_PROGRAM_ATTIRER_PRICE_ID",
  "personal-branding": "STRIPE_PROGRAM_BRANDING_PRICE_ID",
  "exploser-croissance": "STRIPE_PROGRAM_CROISSANCE_PRICE_ID",
} as const satisfies Record<PaidProgramSlug, string>;

export const getProgramCatalogEntry = (slug: string) =>
  isPaidProgramSlug(slug) ? LINKEDIN_PROGRAM_PRODUCTS[slug] : null;

export const getProgramStripePriceId = (slug: string) => {
  if (!isPaidProgramSlug(slug)) return null;
  const value = process.env[PROGRAM_PRICE_ENV_KEYS[slug]]?.trim();
  if (!value) return null;
  return value;
};

type CatalogProductCandidate = {
  active: boolean;
  name: string;
  metadata: Record<string, string> | null;
};

export const isObsoleteJobioCatalogProduct = (
  product: CatalogProductCandidate,
  targetSkus: ReadonlySet<string>,
) => {
  if (!product.active || product.metadata?.app !== "jobio") return false;

  const sku = product.metadata.sku;
  return (
    product.name.toLowerCase().includes("ultra") || !sku || !targetSkus.has(sku)
  );
};
