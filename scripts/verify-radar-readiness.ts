/* eslint-disable no-console */
import { franceTravailProvider } from "@/features/opportunities/providers/france-travail";
import { upfetch } from "@/lib/up-fetch";
import { z } from "zod";

const live = process.argv.includes("--live");
const errors: string[] = [];
const successes: string[] = [];
const expect = (condition: boolean, success: string, failure: string) => {
  if (condition) successes.push(success);
  else errors.push(failure);
};

const domainSchema = z
  .object({
    name: z.string(),
    status: z.string().optional(),
    capabilities: z
      .object({ receiving: z.string(), sending: z.string() })
      .optional(),
  })
  .passthrough();
const webhookSchema = z
  .object({
    endpoint: z.string().url(),
    events: z.array(z.string()),
    status: z.string().optional(),
  })
  .passthrough();

const hasPair = (first: string | undefined, second: string | undefined) =>
  Boolean(first?.trim()) === Boolean(second?.trim());

const verifyStatic = () => {
  expect(
    Boolean(process.env.OPPORTUNITY_INBOUND_DOMAIN?.trim()),
    "Sous-domaine inbound Radar configuré",
    "OPPORTUNITY_INBOUND_DOMAIN absent",
  );
  expect(
    Boolean(
      process.env.FRANCE_TRAVAIL_CLIENT_ID?.trim() &&
        process.env.FRANCE_TRAVAIL_CLIENT_SECRET?.trim(),
    ),
    "France Travail configuré comme source autorisée initiale",
    "Identifiants France Travail absents: aucune source API initiale pour la bêta",
  );
  expect(
    hasPair(process.env.ADZUNA_APP_ID, process.env.ADZUNA_APP_KEY),
    "Configuration Adzuna cohérente",
    "Adzuna est partiellement configuré",
  );
  if (process.env.ADZUNA_APP_ID || process.env.ADZUNA_APP_KEY) {
    expect(
      Boolean(process.env.ADZUNA_LICENSE_APPROVED_AT?.trim()),
      "Validation de licence Adzuna datée",
      "ADZUNA_LICENSE_APPROVED_AT absent alors qu'Adzuna est activé",
    );
  }
  if (process.env.JOOBLE_API_KEY) {
    expect(
      Boolean(process.env.JOOBLE_LICENSE_APPROVED_AT?.trim()),
      "Validation de licence Jooble datée",
      "JOOBLE_LICENSE_APPROVED_AT absent alors que Jooble est activé",
    );
  }
};

const verifyResend = async () => {
  const apiKey = process.env.RESEND_API_KEY;
  const domainName = process.env.OPPORTUNITY_INBOUND_DOMAIN;
  if (!apiKey || !domainName) return;
  const headers = { authorization: `Bearer ${apiKey}` };
  try {
    const [domains, webhooks] = await Promise.all([
      upfetch("https://api.resend.com/domains", {
        headers,
        schema: z.object({ data: z.array(domainSchema) }),
      }),
      upfetch("https://api.resend.com/webhooks", {
        headers,
        schema: z.object({ data: z.array(webhookSchema) }),
      }),
    ]);
    const domain = domains.data.find((item) => item.name === domainName);
    expect(
      domain?.capabilities?.receiving === "enabled" &&
        domain.status === "verified",
      "Domaine Resend inbound vérifié et réception activée",
      `Domaine Resend ${domainName} absent, non vérifié ou réception désactivée`,
    );
    const inboundWebhook = webhooks.data.find((webhook) => {
      const endpoint = new URL(webhook.endpoint);
      return (
        endpoint.hostname === "jobio.fr" &&
        endpoint.pathname === "/api/webhooks/resend" &&
        webhook.events.includes("email.received") &&
        webhook.status !== "disabled"
      );
    });
    expect(
      Boolean(inboundWebhook),
      "Webhook Resend production abonné à email.received",
      "Webhook https://jobio.fr/api/webhooks/resend actif pour email.received introuvable",
    );
  } catch (error) {
    errors.push(
      `Audit Resend impossible (${error instanceof Error ? error.name : "UNKNOWN_ERROR"})`,
    );
  }
};

const verifyFranceTravail = async () => {
  if (!franceTravailProvider.isConfigured()) return;
  try {
    const page = await franceTravailProvider.search(
      {
        titles: ["développeur"],
        skills: [],
        workTypes: [],
        excludedKeywords: [],
        location: "75",
      },
      null,
    );
    expect(
      page.items.length > 0,
      `France Travail répond avec ${page.items.length} offre(s) normalisée(s)`,
      "France Travail répond mais aucune offre de smoke test n'est normalisée",
    );
  } catch (error) {
    errors.push(
      `Smoke France Travail échoué (${error instanceof Error ? error.name : "UNKNOWN_ERROR"})`,
    );
  }
};

const main = async () => {
  verifyStatic();
  if (live) await Promise.all([verifyResend(), verifyFranceTravail()]);
  for (const success of successes) console.log(`[OK] ${success}`);
  for (const error of errors) console.error(`[ERREUR] ${error}`);
  console.log(
    `Radar preflight: ${successes.length} OK, ${errors.length} erreur(s)`,
  );
  process.exitCode = errors.length === 0 ? 0 : 1;
};

void main();
