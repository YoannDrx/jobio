import { createHash } from "node:crypto";
import { safePublicHttpsUrlSchema } from "@/lib/security/public-url";
import type { NormalizedOpportunity } from "./opportunities.schema";

const TRACKING_QUERY_PREFIXES = ["utm_", "pk_"];
const TRACKING_QUERY_KEYS = new Set([
  "fbclid",
  "gclid",
  "mc_cid",
  "mc_eid",
  "ref",
  "source",
]);

export const normalizeOpportunityText = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9+#.]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");

export const canonicalizeOpportunityUrl = (
  value: string | null | undefined,
): string | null => {
  if (!value) return null;
  const parsed = safePublicHttpsUrlSchema.safeParse(value);
  if (!parsed.success) return null;

  const url = new URL(parsed.data);
  url.hash = "";
  for (const key of [...url.searchParams.keys()]) {
    if (
      TRACKING_QUERY_KEYS.has(key.toLowerCase()) ||
      TRACKING_QUERY_PREFIXES.some((prefix) =>
        key.toLowerCase().startsWith(prefix),
      )
    ) {
      url.searchParams.delete(key);
    }
  }
  url.hostname = url.hostname.toLowerCase();
  url.pathname = url.pathname.replace(/\/$/, "") || "/";
  return url.toString();
};

export const createOpportunityFingerprint = (
  opportunity: Pick<
    NormalizedOpportunity,
    "title" | "company" | "location" | "dailyRateMin" | "salaryMin"
  >,
): string => {
  const identity = [
    normalizeOpportunityText(opportunity.title),
    normalizeOpportunityText(opportunity.company ?? ""),
    normalizeOpportunityText(opportunity.location ?? ""),
    String(opportunity.dailyRateMin ?? ""),
    String(opportunity.salaryMin ?? ""),
  ].join("|");
  return createHash("sha256").update(identity).digest("hex");
};

export const inferOpportunityWorkType = (
  ...values: (string | null | undefined)[]
): "REMOTE" | "HYBRID" | "ONSITE" | null => {
  const text = normalizeOpportunityText(values.filter(Boolean).join(" "));
  if (
    /\b(full remote|fully remote|100 remote|teletravail complet|remote)\b/.test(
      text,
    )
  ) {
    return "REMOTE";
  }
  if (/\b(hybrid|hybride|teletravail partiel)\b/.test(text)) return "HYBRID";
  if (/\b(onsite|on site|sur site|presentiel)\b/.test(text)) return "ONSITE";
  return null;
};

export const normalizeSkills = (values: string[]): string[] => {
  const byNormalizedName = new Map<string, string>();
  for (const rawValue of values) {
    const value = rawValue.trim();
    if (!value) continue;
    const key = normalizeOpportunityText(value);
    if (!byNormalizedName.has(key)) byNormalizedName.set(key, value);
  }
  return [...byNormalizedName.values()].slice(0, 100);
};
