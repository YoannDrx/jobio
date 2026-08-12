/* eslint-disable no-console, no-await-in-loop, @typescript-eslint/promise-function-async */
import Stripe from "stripe";

import {
  BILLING_CATALOG_VERSION,
  JOBIO_PRO_PRODUCT,
  LINKEDIN_PROGRAM_PRODUCTS,
  PROGRAM_PRICE,
  isObsoleteJobioCatalogProduct,
} from "../src/lib/stripe/billing-catalog";

const args = new Set(process.argv.slice(2));
const apply = args.has("--apply");
const archiveObsolete = args.has("--archive-obsolete");
const expectedMode = args.has("--live") ? "live" : "test";
const secretKey = process.env.STRIPE_SECRET_KEY;
const publicUrl = (process.env.NEXT_PUBLIC_URL ?? "https://jobio.fr").replace(
  /\/$/,
  "",
);

if (!secretKey) {
  throw new Error("STRIPE_SECRET_KEY est requis");
}
if (expectedMode === "live" && !secretKey.startsWith("sk_live_")) {
  throw new Error("Le mode --live exige une clé Stripe live");
}
if (expectedMode === "test" && !secretKey.startsWith("sk_test_")) {
  throw new Error("Le mode test exige une clé Stripe test");
}

const stripe = new Stripe(secretKey);
const targetSkus = new Set<string>([
  JOBIO_PRO_PRODUCT.sku,
  ...Object.values(LINKEDIN_PROGRAM_PRODUCTS).map((program) => program.sku),
]);

type PriceDefinition = {
  lookupKey: string;
  unitAmount: number;
  currency: string;
  recurring?: { interval: "month" | "year" };
  metadata: Record<string, string>;
};

const listAllProducts = async () => {
  const products: Stripe.Product[] = [];
  let startingAfter: string | undefined;
  do {
    const page = await stripe.products.list({
      limit: 100,
      starting_after: startingAfter,
    });
    products.push(...page.data);
    startingAfter = page.has_more ? page.data.at(-1)?.id : undefined;
  } while (startingAfter);
  return products;
};

const listProductsUsedByCurrentSubscriptions = async () => {
  const productIds = new Set<string>();
  const currentStatuses = new Set<Stripe.Subscription.Status>([
    "active",
    "trialing",
    "past_due",
    "unpaid",
    "paused",
  ]);
  let startingAfter: string | undefined;

  do {
    const page = await stripe.subscriptions.list({
      status: "all",
      limit: 100,
      starting_after: startingAfter,
    });
    for (const subscription of page.data) {
      if (!currentStatuses.has(subscription.status)) continue;
      for (const item of subscription.items.data) {
        const product = item.price.product;
        productIds.add(typeof product === "string" ? product : product.id);
      }
    }
    startingAfter = page.has_more ? page.data.at(-1)?.id : undefined;
  } while (startingAfter);

  return productIds;
};

const getOrCreateProduct = async (input: {
  sku: string;
  name: string;
  description: string;
  image: string;
  statementDescriptor?: string;
  metadata: Record<string, string>;
}) => {
  const products = await listAllProducts();
  const matches = products.filter(
    (product) =>
      product.metadata.app === "jobio" && product.metadata.sku === input.sku,
  );
  const existing = matches.find((product) => product.active) ?? matches.at(0);

  if (!apply) {
    console.log(
      `[dry-run] produit ${input.sku}: ${existing ? `mise à jour ${existing.id}` : "création"}`,
    );
    return existing ?? null;
  }

  const params: Stripe.ProductCreateParams = {
    name: input.name,
    description: input.description,
    images: [`${publicUrl}/images/stripe/${input.image}`],
    statement_descriptor: input.statementDescriptor,
    metadata: input.metadata,
    active: true,
  };
  const product = existing
    ? await stripe.products.update(existing.id, params)
    : await stripe.products.create(params);

  for (const duplicate of matches.filter(
    (candidate) => candidate.id !== product.id && candidate.active,
  )) {
    await stripe.products.update(duplicate.id, { active: false });
  }
  return product;
};

const ensurePrice = async (productId: string, definition: PriceDefinition) => {
  const prices = await stripe.prices.list({
    lookup_keys: [definition.lookupKey],
    active: true,
    limit: 100,
  });
  const matching = prices.data.find(
    (price) =>
      price.product === productId &&
      price.unit_amount === definition.unitAmount &&
      price.currency === definition.currency &&
      price.tax_behavior === "exclusive" &&
      price.recurring?.interval === definition.recurring?.interval,
  );

  if (matching) {
    if (apply) {
      await stripe.prices.update(matching.id, {
        metadata: definition.metadata,
      });
    }
    console.log(`prix ${definition.lookupKey}: ${matching.id}`);
    return matching;
  }

  if (!apply) {
    console.log(`[dry-run] prix ${definition.lookupKey}: création`);
    return null;
  }

  await Promise.all(
    prices.data.map((price) =>
      stripe.prices.update(price.id, { active: false }),
    ),
  );
  const created = await stripe.prices.create({
    product: productId,
    unit_amount: definition.unitAmount,
    currency: definition.currency,
    tax_behavior: "exclusive",
    lookup_key: definition.lookupKey,
    transfer_lookup_key: true,
    recurring: definition.recurring,
    metadata: definition.metadata,
  });
  console.log(`prix ${definition.lookupKey}: ${created.id}`);
  return created;
};

const sync = async () => {
  console.log(
    `${apply ? "APPLICATION" : "AUDIT"} catalogue Jobio v${BILLING_CATALOG_VERSION} (${expectedMode})`,
  );

  const pro = await getOrCreateProduct({
    sku: JOBIO_PRO_PRODUCT.sku,
    name: JOBIO_PRO_PRODUCT.name,
    description: JOBIO_PRO_PRODUCT.description,
    image: JOBIO_PRO_PRODUCT.image,
    statementDescriptor: JOBIO_PRO_PRODUCT.statementDescriptor,
    metadata: { ...JOBIO_PRO_PRODUCT.metadata },
  });
  if (pro) {
    await ensurePrice(pro.id, {
      ...JOBIO_PRO_PRODUCT.prices.monthly,
      recurring: { interval: JOBIO_PRO_PRODUCT.prices.monthly.interval },
      metadata: { ...JOBIO_PRO_PRODUCT.metadata, billing: "monthly" },
    });
    await ensurePrice(pro.id, {
      ...JOBIO_PRO_PRODUCT.prices.yearly,
      recurring: { interval: JOBIO_PRO_PRODUCT.prices.yearly.interval },
      metadata: { ...JOBIO_PRO_PRODUCT.metadata, billing: "yearly" },
    });
  }

  for (const [slug, program] of Object.entries(LINKEDIN_PROGRAM_PRODUCTS)) {
    const metadata = {
      app: "jobio",
      type: "linkedin_program",
      sku: program.sku,
      slug,
      catalog_version: String(BILLING_CATALOG_VERSION),
    };
    const product = await getOrCreateProduct({
      ...program,
      statementDescriptor: "JOBIO",
      metadata,
    });
    if (product) {
      await ensurePrice(product.id, {
        lookupKey: program.sku,
        unitAmount: PROGRAM_PRICE.unitAmount,
        currency: PROGRAM_PRICE.currency,
        metadata,
      });
    }
  }

  const [products, productsUsedByCurrentSubscriptions] = await Promise.all([
    listAllProducts(),
    listProductsUsedByCurrentSubscriptions(),
  ]);
  const obsolete = products.filter((product) =>
    isObsoleteJobioCatalogProduct(product, targetSkus),
  );
  for (const product of obsolete) {
    if (productsUsedByCurrentSubscriptions.has(product.id)) {
      console.log(
        `[préservé] ${product.id}: utilisé par un abonnement historique actif`,
      );
      continue;
    }
    if (!archiveObsolete) {
      console.log(`[à archiver après bascule] ${product.id}`);
      continue;
    }
    console.log(`${apply ? "archive" : "[dry-run] archive"}: ${product.id}`);
    if (apply) await stripe.products.update(product.id, { active: false });
  }
};

void sync();
