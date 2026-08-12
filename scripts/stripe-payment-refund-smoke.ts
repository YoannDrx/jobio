/* eslint-disable no-console */
import { randomUUID } from "node:crypto";

import Stripe from "stripe";

const secretKey = process.env.STRIPE_SECRET_KEY ?? "";
if (!secretKey.startsWith("sk_test_")) {
  throw new Error(
    "This smoke test is intentionally restricted to a Stripe test-mode key",
  );
}

const stripe = new Stripe(secretKey, { typescript: true });
const runId = randomUUID();

const main = async () => {
  const intent = await stripe.paymentIntents.create(
    {
      amount: 50,
      currency: "eur",
      payment_method: "pm_card_visa",
      confirm: true,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: "never",
      },
      metadata: { app: "jobio", purpose: "payment-refund-smoke", runId },
    },
    { idempotencyKey: `jobio-payment-smoke-${runId}` },
  );
  if (intent.status !== "succeeded") {
    throw new Error(`Test payment did not succeed (${intent.status})`);
  }

  const refund = await stripe.refunds.create(
    { payment_intent: intent.id, reason: "requested_by_customer" },
    { idempotencyKey: `jobio-refund-smoke-${runId}` },
  );
  if (refund.status !== "succeeded") {
    throw new Error(`Test refund did not succeed (${refund.status})`);
  }

  console.log(
    "[OK] Stripe test-mode payment and full refund completed successfully.",
  );
};

void main();
