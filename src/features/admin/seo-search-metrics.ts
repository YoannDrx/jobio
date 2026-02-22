import { env } from "@/lib/env";
import { readFile } from "node:fs/promises";
import { z } from "zod";

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

export type SeoSearchMetricsSource = "env_json" | "file" | "none";

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

  const fromFile = env.SEO_SEARCH_METRICS_FILE?.trim();

  if (fromFile) {
    try {
      const fileContent = await readFile(fromFile, "utf-8");
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
  }

  return {
    status: "not_configured",
    source: "none",
    payload: null,
    error: null,
  };
};
