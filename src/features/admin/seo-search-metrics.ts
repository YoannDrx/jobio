import { env } from "@/lib/env";
import { readFile } from "node:fs/promises";
import { z } from "zod";

const DEFAULT_ENDPOINT_TIMEOUT_MS = 8_000;

const seoTotalsSchema = z.object({
  clicks: z.number().int().nonnegative(),
  impressions: z.number().int().nonnegative(),
  ctr: z.number().min(0).max(1),
  averagePosition: z.number().nonnegative().nullable().optional(),
});

const topQuerySchema = z.object({
  query: z.string().min(1),
  clicks: z.number().int().nonnegative(),
  impressions: z.number().int().nonnegative(),
  ctr: z.number().min(0).max(1),
  position: z.number().nonnegative().nullable().optional(),
});

const topPageSchema = z.object({
  path: z.string().min(1),
  clicks: z.number().int().nonnegative(),
  impressions: z.number().int().nonnegative(),
  ctr: z.number().min(0).max(1),
});

const seoSnapshotSchema = z.object({
  provider: z.enum(["google_search_console", "bing_webmaster", "combined"]),
  capturedAt: z.string().datetime(),
  period: z.object({
    from: z.string().date(),
    to: z.string().date(),
    label: z.string().min(1).optional(),
  }),
  totals: seoTotalsSchema,
  indexedPages: z
    .object({
      public: z.number().int().nonnegative().nullable().optional(),
      private: z.number().int().nonnegative().nullable().optional(),
    })
    .optional(),
  topQueries: z.array(topQuerySchema).max(20).optional(),
  topPages: z.array(topPageSchema).max(20).optional(),
  notes: z.string().max(1_000).optional(),
});

const seoSearchMetricsPayloadSchema = z.object({
  current: seoSnapshotSchema,
  previous: seoSnapshotSchema.optional(),
});

export type SeoSearchSnapshot = z.infer<typeof seoSnapshotSchema>;
export type SeoSearchMetricsPayload = z.infer<typeof seoSearchMetricsPayloadSchema>;

export type SeoSearchMetricsSource = "env_json" | "endpoint" | "file" | "none";

export type SeoSearchMetricsState = {
  status: "configured" | "not_configured" | "invalid";
  source: SeoSearchMetricsSource;
  payload: SeoSearchMetricsPayload | null;
  error: string | null;
};

const parsePayload = (rawValue: string): SeoSearchMetricsPayload => {
  const parsedJson: unknown = JSON.parse(rawValue);
  return seoSearchMetricsPayloadSchema.parse(parsedJson);
};

const loadFromEndpoint = async (
  endpointUrl: string,
): Promise<SeoSearchMetricsState> => {
  const timeoutMs =
    env.SEO_SEARCH_METRICS_TIMEOUT_MS ?? DEFAULT_ENDPOINT_TIMEOUT_MS;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const headers = new Headers({
      Accept: "application/json",
    });

    if (env.SEO_SEARCH_METRICS_BEARER_TOKEN) {
      headers.set(
        "Authorization",
        `Bearer ${env.SEO_SEARCH_METRICS_BEARER_TOKEN}`,
      );
    }

    const response = await fetch(endpointUrl, {
      method: "GET",
      headers,
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      return {
        status: "invalid",
        source: "endpoint",
        payload: null,
        error: `Endpoint returned status ${response.status}`,
      };
    }

    const rawContent = await response.text();

    try {
      return {
        status: "configured",
        source: "endpoint",
        payload: parsePayload(rawContent),
        error: null,
      };
    } catch (error) {
      return {
        status: "invalid",
        source: "endpoint",
        payload: null,
        error: error instanceof Error ? error.message : "Payload endpoint invalide",
      };
    }
  } catch (error) {
    return {
      status: "invalid",
      source: "endpoint",
      payload: null,
      error:
        error instanceof Error
          ? error.message
          : "Impossible de charger le snapshot SEO distant",
    };
  } finally {
    clearTimeout(timeout);
  }
};

const loadFromFile = async (filePath: string): Promise<SeoSearchMetricsState> => {
  try {
    const fileContent = await readFile(filePath, "utf-8");
    return {
      status: "configured",
      source: "file",
      payload: parsePayload(fileContent),
      error: null,
    };
  } catch (error) {
    return {
      status: "invalid",
      source: "file",
      payload: null,
      error: error instanceof Error ? error.message : "Fichier métriques invalide",
    };
  }
};

export const loadSeoSearchMetricsState = async (): Promise<SeoSearchMetricsState> => {
  const fromEnv = env.SEO_SEARCH_METRICS_JSON?.trim();

  if (fromEnv) {
    try {
      return {
        status: "configured",
        source: "env_json",
        payload: parsePayload(fromEnv),
        error: null,
      };
    } catch (error) {
      return {
        status: "invalid",
        source: "env_json",
        payload: null,
        error: error instanceof Error ? error.message : "JSON invalide",
      };
    }
  }

  const fromEndpoint = env.SEO_SEARCH_METRICS_ENDPOINT?.trim();

  if (fromEndpoint) {
    return loadFromEndpoint(fromEndpoint);
  }

  const fromFile = env.SEO_SEARCH_METRICS_FILE?.trim();

  if (fromFile) {
    return loadFromFile(fromFile);
  }

  return {
    status: "not_configured",
    source: "none",
    payload: null,
    error: null,
  };
};
