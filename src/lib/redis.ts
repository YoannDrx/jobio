import Redis from "ioredis";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

export const redisClient = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => {
    if (times > 3) {
      return null;
    }
    return Math.min(times * 50, 2000);
  },
  lazyConnect: false,
});

// ioredis emits connection failures as EventEmitter `error` events in
// addition to rejecting individual commands. Always attach a listener so a
// transient Redis outage is observable without becoming an unhandled runtime
// error at the process level.
redisClient.on("error", (error) => {
  logger.warn("[Redis] Connection error", {
    name: error.name,
    message: error.message,
  });
});
