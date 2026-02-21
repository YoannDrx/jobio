import { logger } from "@/lib/logger";
import { redisClient } from "@/lib/redis";

type EnforceRateLimitInput = {
  key: string;
  limit: number;
  windowSeconds: number;
};

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

/**
 * Lightweight fixed-window rate limiter backed by Redis.
 * Fail-open by design to avoid blocking legitimate traffic if Redis is degraded.
 */
export const enforceRateLimit = async (
  input: EnforceRateLimitInput,
): Promise<RateLimitResult> => {
  const { key, limit, windowSeconds } = input;
  const redisKey = `rl:${key}`;

  try {
    const count = await redisClient.incr(redisKey);
    if (count === 1) {
      await redisClient.expire(redisKey, windowSeconds);
    }

    const ttl = await redisClient.ttl(redisKey);
    const retryAfterSeconds = ttl > 0 ? ttl : windowSeconds;
    const remaining = Math.max(0, limit - count);

    return {
      allowed: count <= limit,
      remaining,
      retryAfterSeconds,
    };
  } catch (error) {
    logger.warn("[rate-limit] Redis unavailable, failing open", {
      key,
      error,
    });

    return {
      allowed: true,
      remaining: limit,
      retryAfterSeconds: 0,
    };
  }
};
