const DEFAULT_SERVERLESS_CONNECTION_LIMIT = 3;
const DEFAULT_POOL_TIMEOUT_SECONDS = 20;

export const getPrismaDatasourceUrl = (
  rawUrl: string | undefined,
  options: {
    connectionLimit?: number;
    poolTimeoutSeconds?: number;
  } = {},
) => {
  if (!rawUrl) return undefined;
  try {
    const url = new URL(rawUrl);
    if (!url.protocol.startsWith("postgres")) return rawUrl;
    if (!url.searchParams.has("connection_limit")) {
      url.searchParams.set(
        "connection_limit",
        String(options.connectionLimit ?? DEFAULT_SERVERLESS_CONNECTION_LIMIT),
      );
    }
    if (!url.searchParams.has("pool_timeout")) {
      url.searchParams.set(
        "pool_timeout",
        String(options.poolTimeoutSeconds ?? DEFAULT_POOL_TIMEOUT_SECONDS),
      );
    }
    return url.toString();
  } catch {
    return rawUrl;
  }
};
