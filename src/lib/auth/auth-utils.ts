const CALLBACK_PROTOCOL_REGEX = /^[a-zA-Z][a-zA-Z\d+\-.]*:/;

const hasInvalidCallbackChars = (value: string): boolean => {
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    if (code <= 31 || code === 127 || value[i] === "\\") {
      return true;
    }
  }
  return false;
};

const normalizePath = (value: string, fallbackPath = "/"): string => {
  const trimmed = value.trim();

  if (!trimmed) return fallbackPath;
  if (trimmed === "null") return "/";
  if (CALLBACK_PROTOCOL_REGEX.test(trimmed)) return fallbackPath;
  if (hasInvalidCallbackChars(trimmed)) return fallbackPath;
  if (trimmed.startsWith("//")) return fallbackPath;

  const normalized = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  if (normalized.startsWith("//")) return fallbackPath;

  return normalized;
};

export const sanitizeCallbackUrl = (
  value: string | null | undefined,
  fallbackUrl: string,
): string => {
  const safeFallback = normalizePath(fallbackUrl, "/");

  if (typeof value !== "string") return safeFallback;
  return normalizePath(value, safeFallback);
};

export const getCallbackUrl = (
  fallbackUrl: string,
  callbackFromProps?: string | null,
): string => {
  const searchParams = new URLSearchParams(window.location.search);
  const callbackUrlParams = searchParams.get("callbackUrl");
  return sanitizeCallbackUrl(
    callbackUrlParams ?? callbackFromProps,
    fallbackUrl,
  );
};
