import {
  BILLING_CATALOG_VERSION,
  JOBIO_PRO_PRODUCT,
  LINKEDIN_PROGRAM_PRODUCTS,
  PROGRAM_PRICE,
  PROGRAM_PRICE_ENV_KEYS,
  getProgramCatalogEntry,
  isObsoleteJobioCatalogProduct,
} from "@/lib/stripe/billing-catalog";
import { describe, expect, it } from "vitest";

describe("billing catalog", () => {
  it("defines the exact recurring Pro prices", () => {
    expect(BILLING_CATALOG_VERSION).toBe(1);
    expect(JOBIO_PRO_PRODUCT.prices.monthly).toMatchObject({
      lookupKey: "jobio_pro_monthly_v1",
      unitAmount: 1900,
      currency: "eur",
      interval: "month",
    });
    expect(JOBIO_PRO_PRODUCT.prices.yearly).toMatchObject({
      lookupKey: "jobio_pro_yearly_v1",
      unitAmount: 19000,
      currency: "eur",
      interval: "year",
    });
    expect(JOBIO_PRO_PRODUCT.metadata).toMatchObject({
      app: "jobio",
      sku: "jobio_pro",
      plan: "pro",
      catalog_version: "1",
    });
  });

  it("contains exactly three paid lifetime programs at 39 euros", () => {
    expect(Object.keys(LINKEDIN_PROGRAM_PRODUCTS)).toHaveLength(3);
    expect(PROGRAM_PRICE).toEqual({
      unitAmount: 3900,
      currency: "eur",
      taxBehavior: "exclusive",
    });
    expect(getProgramCatalogEntry("attirer-clients")?.sku).toBe(
      "linkedin_attirer_clients_v1",
    );
    expect(getProgramCatalogEntry("unknown")).toBeNull();
    expect(PROGRAM_PRICE_ENV_KEYS).toEqual({
      "attirer-clients": "STRIPE_PROGRAM_ATTIRER_PRICE_ID",
      "personal-branding": "STRIPE_PROGRAM_BRANDING_PRICE_ID",
      "exploser-croissance": "STRIPE_PROGRAM_CROISSANCE_PRICE_ID",
    });
  });

  it("never archives products belonging to another Stripe application", () => {
    const targetSkus = new Set(["jobio_pro"]);

    expect(
      isObsoleteJobioCatalogProduct(
        {
          active: true,
          name: "Moodday Ultra",
          metadata: { app: "moodday" },
        },
        targetSkus,
      ),
    ).toBe(false);
    expect(
      isObsoleteJobioCatalogProduct(
        {
          active: true,
          name: "Jobio Pro — ancien catalogue",
          metadata: { app: "jobio" },
        },
        targetSkus,
      ),
    ).toBe(true);
    expect(
      isObsoleteJobioCatalogProduct(
        {
          active: true,
          name: "Jobio Pro",
          metadata: { app: "jobio", sku: "jobio_pro" },
        },
        targetSkus,
      ),
    ).toBe(false);
  });
});
