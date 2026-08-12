import { isIP } from "node:net";
import { lookup } from "node:dns/promises";

import { z } from "zod";

export const isPrivateOrReservedIpv4 = (hostname: string) => {
  const octets = hostname.split(".").map(Number);
  if (octets.length !== 4 || octets.some((value) => !Number.isInteger(value))) {
    return false;
  }
  const [first = 0, second = 0] = octets;
  return (
    first === 10 ||
    first === 127 ||
    first === 0 ||
    first >= 224 ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 100 && second >= 64 && second <= 127) ||
    (first === 192 && second === 168) ||
    (first === 192 && second === 0 && [0, 2].includes(octets[2] ?? -1)) ||
    (first === 198 && [18, 19].includes(second)) ||
    (first === 198 && second === 51 && octets[2] === 100) ||
    (first === 203 && second === 0 && octets[2] === 113)
  );
};

const mappedIpv4FromIpv6 = (value: string): string | null => {
  if (!value.startsWith("::ffff:")) return null;
  const suffix = value.slice("::ffff:".length);
  if (isIP(suffix) === 4) return suffix;
  const groups = suffix.split(":");
  if (groups.length !== 2) return null;
  const high = Number.parseInt(groups[0] ?? "", 16);
  const low = Number.parseInt(groups[1] ?? "", 16);
  if (!Number.isInteger(high) || !Number.isInteger(low)) return null;
  return [high >> 8, high & 255, low >> 8, low & 255].join(".");
};

export const isPrivateOrReservedIp = (hostname: string): boolean => {
  const normalized = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (isIP(normalized) === 4) return isPrivateOrReservedIpv4(normalized);
  if (isIP(normalized) !== 6) return false;
  const mappedIpv4 = mappedIpv4FromIpv6(normalized);
  if (mappedIpv4) return isPrivateOrReservedIpv4(mappedIpv4);

  return (
    normalized === "::" ||
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe8") ||
    normalized.startsWith("fe9") ||
    normalized.startsWith("fea") ||
    normalized.startsWith("feb") ||
    normalized.startsWith("ff") ||
    normalized.startsWith("100:") ||
    normalized.startsWith("2001:2:") ||
    normalized.startsWith("2001:db8:")
  );
};

export const isSafePublicHttpsUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase().replace(/\.$/, "");
    if (url.protocol !== "https:" || url.username || url.password) return false;
    if (
      hostname === "localhost" ||
      hostname.endsWith(".localhost") ||
      hostname.endsWith(".local") ||
      hostname.endsWith(".internal")
    ) {
      return false;
    }
    if (isIP(hostname)) return !isPrivateOrReservedIp(hostname);
    return hostname.includes(".");
  } catch {
    return false;
  }
};

export const safePublicHttpsUrlSchema = z
  .url()
  .max(2048)
  .refine(
    isSafePublicHttpsUrl,
    "Utilise une URL HTTPS publique, sans adresse locale ou privée.",
  );

/**
 * Resolve the hostname immediately before an outbound request and reject any
 * private/reserved answer. Call this again for every redirect target.
 */
export const assertPublicHostnameResolvesSafely = async (
  value: string,
): Promise<URL> => {
  const parsed = safePublicHttpsUrlSchema.parse(value);
  const url = new URL(parsed);

  if (isIP(url.hostname)) return url;

  const answers = await lookup(url.hostname, { all: true, verbatim: true });
  if (
    answers.length === 0 ||
    answers.some(({ address }) => isPrivateOrReservedIp(address))
  ) {
    throw new Error("L’URL ne résout pas vers une adresse publique autorisée.");
  }

  return url;
};
