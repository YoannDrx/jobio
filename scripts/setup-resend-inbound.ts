/* eslint-disable no-console */
import { upfetch } from "@/lib/up-fetch";
import { z } from "zod";

const domainName =
  process.env.OPPORTUNITY_INBOUND_DOMAIN ?? "opportunites.jobio.fr";
const apiKey = process.env.RESEND_API_KEY;
if (!apiKey) throw new Error("RESEND_API_KEY is required");

const capabilitySchema = z.object({
  sending: z.string(),
  receiving: z.string(),
});
const recordSchema = z
  .object({
    record: z.string().optional(),
    name: z.string(),
    type: z.string(),
    value: z.string(),
    priority: z.number().optional(),
    status: z.string().optional(),
  })
  .passthrough();
const domainSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    status: z.string().optional(),
    capabilities: capabilitySchema.optional(),
    records: z.array(recordSchema).optional(),
  })
  .passthrough();
const headers = { authorization: `Bearer ${apiKey}` };
const webhookSchema = z
  .object({
    id: z.string(),
    endpoint: z.string().url(),
    status: z.string(),
    events: z.array(z.string()).nullable(),
  })
  .passthrough();

const ensureInboundWebhook = async () => {
  const list = await upfetch("https://api.resend.com/webhooks", {
    headers,
    schema: z.object({ data: z.array(webhookSchema) }),
  });
  const webhook = list.data.find((item) => {
    const endpoint = new URL(item.endpoint);
    return (
      endpoint.hostname === "jobio.fr" &&
      endpoint.pathname === "/api/webhooks/resend"
    );
  });
  if (!webhook) {
    throw new Error(
      "RESEND_WEBHOOK_MISSING: create it in Resend, then store its signing secret before retrying",
    );
  }
  const events = [...new Set([...(webhook.events ?? []), "email.received"])];
  if (
    webhook.events?.includes("email.received") &&
    webhook.status === "enabled"
  ) {
    console.log("[OK] Resend webhook already receives email.received");
    return;
  }
  await upfetch(`https://api.resend.com/webhooks/${webhook.id}`, {
    method: "PATCH",
    headers,
    body: { events, status: "enabled" },
    schema: z.object({ id: z.string() }).passthrough(),
  });
  console.log("[OK] Resend webhook now receives email.received");
};

const main = async () => {
  await ensureInboundWebhook();
  const list = await upfetch("https://api.resend.com/domains", {
    headers,
    schema: z.object({ data: z.array(domainSchema) }),
  });
  let domain = list.data.find((item) => item.name === domainName);

  if (!domain) {
    domain = await upfetch("https://api.resend.com/domains", {
      method: "POST",
      headers,
      body: {
        name: domainName,
        region: "eu-west-1",
        capabilities: { sending: "disabled", receiving: "enabled" },
      },
      schema: domainSchema,
    });
    console.log(`[OK] Resend inbound domain created: ${domainName}`);
  } else if (domain.capabilities?.receiving !== "enabled") {
    domain = await upfetch(`https://api.resend.com/domains/${domain.id}`, {
      method: "PATCH",
      headers,
      body: {
        capabilities: { sending: "disabled", receiving: "enabled" },
      },
      schema: domainSchema,
    });
    console.log(`[OK] Resend receiving enabled: ${domainName}`);
  } else {
    console.log(`[OK] Resend receiving already enabled: ${domainName}`);
  }

  console.log(
    JSON.stringify(
      {
        name: domain.name,
        status: domain.status,
        capabilities: domain.capabilities,
        dnsRecords: (domain.records ?? []).map((record) => ({
          record: record.record,
          name: record.name,
          type: record.type,
          value: record.value,
          priority: record.priority,
          status: record.status,
        })),
      },
      null,
      2,
    ),
  );
};

void main().catch((error: unknown) => {
  const providerMessage =
    typeof error === "object" &&
    error !== null &&
    "data" in error &&
    typeof error.data === "object" &&
    error.data !== null &&
    "message" in error.data &&
    typeof error.data.message === "string"
      ? error.data.message
      : null;
  console.error(
    `[ERREUR] Resend inbound non configuré: ${providerMessage ?? (error instanceof Error ? error.name : "UNKNOWN_ERROR")}`,
  );
  process.exitCode = 1;
});
