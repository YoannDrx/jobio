/* eslint-disable no-console */
import Stripe from "stripe";

import {
  JOBIO_PORTAL_CONFIGURATION,
  JOBIO_PORTAL_CONFIGURATION_NAME,
} from "../src/lib/stripe/billing-portal-config";

const args = new Set(process.argv.slice(2));
const apply = args.has("--apply");
const expectedMode = args.has("--live") ? "live" : "test";
const secretKey = process.env.STRIPE_SECRET_KEY;

if (!secretKey) throw new Error("STRIPE_SECRET_KEY est requis");
if (expectedMode === "live" && !secretKey.startsWith("sk_live_")) {
  throw new Error("Le mode --live exige une clé Stripe live");
}
if (expectedMode === "test" && !secretKey.startsWith("sk_test_")) {
  throw new Error("Le mode test exige une clé Stripe test");
}

const stripe = new Stripe(secretKey);

const sync = async () => {
  const configurations = await stripe.billingPortal.configurations.list({
    limit: 100,
  });
  const matches = configurations.data.filter(
    (configuration) =>
      configuration.metadata?.app === "jobio" ||
      configuration.name === JOBIO_PORTAL_CONFIGURATION_NAME,
  );
  const existing = matches.find((configuration) => configuration.active);

  if (!apply) {
    console.log(
      `[dry-run] portail Jobio (${expectedMode}) : ${existing ? `mise à jour ${existing.id}` : "création"}`,
    );
    return;
  }

  const configuration = existing
    ? await stripe.billingPortal.configurations.update(
        existing.id,
        JOBIO_PORTAL_CONFIGURATION,
      )
    : await stripe.billingPortal.configurations.create(
        JOBIO_PORTAL_CONFIGURATION,
      );

  await Promise.all(
    matches
      .filter(
        (candidate) => candidate.id !== configuration.id && candidate.active,
      )
      .map(async (candidate) => {
        await stripe.billingPortal.configurations.update(candidate.id, {
          active: false,
        });
      }),
  );

  console.log(`portail Jobio : ${configuration.id}`);
};

void sync().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Erreur inconnue";
  console.error(`Échec de synchronisation du portail Stripe : ${message}`);
  process.exitCode = 1;
});
