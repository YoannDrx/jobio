import { timingSafeEqual } from "node:crypto";

type CronAuthFailure = {
  status: 401 | 503;
  publicError: "Unauthorized" | "Service unavailable";
  logMessage: string;
};

const toBuffer = (value: string) => Buffer.from(value, "utf8");

const safeTokenCompare = (received: string, expected: string): boolean => {
  const receivedBuffer = toBuffer(received);
  const expectedBuffer = toBuffer(expected);

  if (receivedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(receivedBuffer, expectedBuffer);
};

const extractBearerToken = (
  authorizationHeader: string | null,
): string | null => {
  if (!authorizationHeader) return null;
  if (!authorizationHeader.startsWith("Bearer ")) return null;

  const token = authorizationHeader.slice("Bearer ".length).trim();
  return token.length > 0 ? token : null;
};

export const validateCronAuthorization = (
  authorizationHeader: string | null,
  cronSecret: string | undefined = process.env.CRON_SECRET,
): CronAuthFailure | null => {
  const configuredSecret = cronSecret?.trim();

  if (!configuredSecret) {
    return {
      status: 503,
      publicError: "Service unavailable",
      logMessage: "CRON_SECRET is not configured",
    };
  }

  const token = extractBearerToken(authorizationHeader);
  if (!token || !safeTokenCompare(token, configuredSecret)) {
    return {
      status: 401,
      publicError: "Unauthorized",
      logMessage: "Invalid authorization header",
    };
  }

  return null;
};
