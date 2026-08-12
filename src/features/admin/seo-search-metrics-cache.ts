import { logger } from "@/lib/logger";
import { redisClient } from "@/lib/redis";

export const SEO_SEARCH_METRICS_CACHE_KEY = "seo:search-metrics:latest";
export const SEO_SEARCH_METRICS_CACHE_TTL_SECONDS = 60 * 60 * 24 * 14;

export const getSeoSearchMetricsCacheRaw = async (): Promise<string | null> => {
  try {
    return await redisClient.get(SEO_SEARCH_METRICS_CACHE_KEY);
  } catch (error) {
    logger.warn("Unable to read SEO search metrics cache", error);
    return null;
  }
};

export const setSeoSearchMetricsCacheRaw = async (
  payload: string,
  ttlSeconds = SEO_SEARCH_METRICS_CACHE_TTL_SECONDS,
): Promise<void> => {
  try {
    await redisClient.set(
      SEO_SEARCH_METRICS_CACHE_KEY,
      payload,
      "EX",
      ttlSeconds,
    );
  } catch (error) {
    logger.warn("Unable to write SEO search metrics cache", error);
  }
};
