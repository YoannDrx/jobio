import type Stripe from "stripe";

export const JOBIO_PORTAL_CONFIGURATION_NAME = "Jobio — portail v1";

export const JOBIO_PORTAL_CONFIGURATION = {
  name: JOBIO_PORTAL_CONFIGURATION_NAME,
  default_return_url: "https://jobio.fr/account/billing",
  business_profile: {
    headline: "Abonnement Jobio, paiements et factures.",
    privacy_policy_url: "https://jobio.fr/legal/privacy",
    terms_of_service_url: "https://jobio.fr/legal/sales",
  },
  features: {
    customer_update: {
      enabled: true,
      allowed_updates: ["email", "address", "tax_id"],
    },
    invoice_history: { enabled: true },
    payment_method_update: { enabled: true },
    subscription_cancel: {
      enabled: true,
      mode: "at_period_end",
      proration_behavior: "none",
      cancellation_reason: {
        enabled: true,
        options: [
          "too_expensive",
          "missing_features",
          "unused",
          "switched_service",
          "customer_service",
          "other",
        ],
      },
    },
    subscription_update: { enabled: false },
  },
  metadata: {
    app: "jobio",
    catalog_version: "1",
  },
} satisfies Stripe.BillingPortal.ConfigurationCreateParams;
