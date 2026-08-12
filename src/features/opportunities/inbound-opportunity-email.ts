import "server-only";
import { InboundOpportunityAlertStatus } from "@/generated/prisma";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { upfetch } from "@/lib/up-fetch";
import { z } from "zod";
import {
  canonicalizeOpportunityUrl,
  inferOpportunityWorkType,
} from "./opportunity-normalization";
import { ingestOpportunityForUser } from "./opportunity-service";
import { opportunityCriteriaSchema } from "./opportunities.schema";

const MAX_RECEIVED_EMAIL_BYTES = 500_000;
const receivedEmailSchema = z.object({
  id: z.string(),
  to: z.array(z.string()),
  from: z.string(),
  subject: z.string().nullish(),
  text: z.string().nullish(),
  html: z.string().nullish(),
  created_at: z.string(),
  attachments: z.array(z.unknown()).default([]),
});

export type InboundOpportunityEvent = {
  emailId: string;
  to: string[];
  from: string;
  subject: string | null;
  receivedAt: Date;
};

const stripHtml = (value: string): string =>
  value
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
    .replace(/<\/(?:p|div|li|tr|h[1-6])>|<br\s*\/?\s*>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#?\w+;/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const recipientToken = (recipients: string[]): string | null => {
  const expectedDomain = (
    env.OPPORTUNITY_INBOUND_DOMAIN ?? "opportunites.jobio.fr"
  ).toLowerCase();
  for (const recipient of recipients) {
    const [localPart, domain] = recipient.trim().toLowerCase().split("@");
    if (localPart && domain === expectedDomain) return localPart;
  }
  return null;
};

const retrieveReceivedEmail = async (emailId: string) =>
  upfetch(`https://api.resend.com/emails/receiving/${emailId}`, {
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}` },
    timeout: 10_000,
    retry: { attempts: 2 },
    parseResponse: async (response) => {
      const declaredLength = Number(
        response.headers.get("content-length") ?? 0,
      );
      if (declaredLength > MAX_RECEIVED_EMAIL_BYTES) {
        throw new Error("Received email payload is too large");
      }
      const raw = await response.text();
      if (Buffer.byteLength(raw, "utf8") > MAX_RECEIVED_EMAIL_BYTES) {
        throw new Error("Received email payload is too large");
      }
      return receivedEmailSchema.parse(JSON.parse(raw));
    },
  });

const extractInboundListings = ({
  emailId,
  subject,
  content,
  senderDomain,
  receivedAt,
}: {
  emailId: string;
  subject: string;
  content: string;
  senderDomain: string | null;
  receivedAt: Date;
}) => {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const candidates = lines.flatMap((line, index) => {
    const urls = line.match(/https:\/\/[^\s<>()"']+/gi) ?? [];
    return urls.flatMap((rawUrl) => {
      const canonicalUrl = canonicalizeOpportunityUrl(rawUrl);
      if (!canonicalUrl) return [];
      const previousLine = lines[index - 1];
      const title =
        previousLine &&
        previousLine.length >= 3 &&
        previousLine.length <= 300 &&
        !previousLine.includes("https://")
          ? previousLine
          : subject;
      return [{ canonicalUrl, title }];
    });
  });
  const uniqueCandidates = [
    ...new Map(candidates.map((item) => [item.canonicalUrl, item])).values(),
  ].slice(0, 20);
  const listings =
    uniqueCandidates.length > 0
      ? uniqueCandidates
      : [{ canonicalUrl: null, title: subject }];

  return listings.map((candidate, index) => ({
    source: "INBOUND_EMAIL" as const,
    externalIdentifier: `${emailId}:${index}`,
    canonicalUrl: candidate.canonicalUrl,
    title: candidate.title,
    company: null,
    description: content,
    location: null,
    workType: inferOpportunityWorkType(candidate.title, content),
    skills: [] as string[],
    dailyRateMin: null,
    dailyRateMax: null,
    salaryMin: null,
    salaryMax: null,
    currency: "EUR",
    duration: null,
    publishedAt: receivedAt,
    expiresAt: null,
    provenance: {
      provider: "Alerte transférée par l’utilisateur",
      senderDomain,
    },
  }));
};

export const processInboundOpportunityEmail = async (
  event: InboundOpportunityEvent,
): Promise<{ accepted: boolean; parsedCount: number }> => {
  const token = recipientToken(event.to);
  if (!token) {
    logger.warn("Inbound opportunity email ignored: unknown recipient domain", {
      emailId: event.emailId,
    });
    return { accepted: false, parsedCount: 0 };
  }
  const inbox = await prisma.opportunityInbox.findFirst({
    where: { addressToken: token, isActive: true },
  });
  if (!inbox) {
    logger.warn("Inbound opportunity email ignored: unknown token", {
      emailId: event.emailId,
    });
    return { accepted: false, parsedCount: 0 };
  }

  const alert = await prisma.inboundOpportunityAlert.upsert({
    where: { providerEmailId: event.emailId },
    create: {
      userId: inbox.userId,
      inboxId: inbox.id,
      providerEmailId: event.emailId,
      recipient: event.to.join(",").slice(0, 500),
      senderDomain: event.from.split("@").at(-1)?.slice(0, 200),
      subject: event.subject?.slice(0, 500),
      status: InboundOpportunityAlertStatus.PROCESSING,
      receivedAt: event.receivedAt,
    },
    update: { status: InboundOpportunityAlertStatus.PROCESSING },
  });

  try {
    const email = await retrieveReceivedEmail(event.emailId);
    const content = (email.text ?? stripHtml(email.html ?? "")).slice(
      0,
      50_000,
    );
    if (content.length < 30) throw new Error("Email content is too short");
    const subject = (email.subject ?? event.subject ?? "Alerte mission").slice(
      0,
      300,
    );
    const profile = await prisma.userProfile.findFirst({
      where: { userId: inbox.userId },
      orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
      select: {
        skills: true,
        tjmTarget: true,
        workTypePreference: true,
        zone: true,
      },
    });
    const watches = await prisma.opportunityWatch.findMany({
      where: { userId: inbox.userId, isActive: true },
    });
    const defaultCriteria = opportunityCriteriaSchema.parse({
      titles: [subject],
      skills: [],
      workTypes: [],
      excludedKeywords: [],
    });
    const opportunities = extractInboundListings({
      emailId: event.emailId,
      subject,
      content,
      senderDomain: event.from.split("@").at(-1) ?? null,
      receivedAt: event.receivedAt,
    });
    if (watches.length === 0) {
      await Promise.all(
        opportunities.map(async (opportunity) =>
          ingestOpportunityForUser({
            userId: inbox.userId,
            opportunity,
            criteria: defaultCriteria,
            profile,
          }),
        ),
      );
    } else {
      await Promise.all(
        watches.flatMap((watch) =>
          opportunities.map(async (opportunity) =>
            ingestOpportunityForUser({
              userId: inbox.userId,
              opportunity,
              criteria: opportunityCriteriaSchema.parse(watch.criteria),
              profile,
              watchId: watch.id,
            }),
          ),
        ),
      );
    }
    await prisma.inboundOpportunityAlert.update({
      where: { id: alert.id },
      data: {
        status: InboundOpportunityAlertStatus.PROCESSED,
        parsedCount: opportunities.length,
        processedAt: new Date(),
        // No raw body is persisted by Jobio. Resend currently exposes retrieval,
        // but no deletion endpoint for received emails.
        rawPurgedAt: new Date(),
      },
    });
    return { accepted: true, parsedCount: opportunities.length };
  } catch (error) {
    await prisma.inboundOpportunityAlert.update({
      where: { id: alert.id },
      data: {
        status: InboundOpportunityAlertStatus.FAILED,
        errorCode: "INBOUND_PARSE_FAILED",
        processedAt: new Date(),
      },
    });
    throw error;
  }
};
