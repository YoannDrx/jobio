import { createSafeActionClient } from "next-safe-action";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { getRequiredUser } from "../auth/auth-user";
import { ApplicationError } from "../errors/application-error";
import { isNextPrerenderInterruptedError } from "../errors/next-prerender-interrupted";
import { logger } from "../logger";
import { logSystemError } from "../monitoring/log-system-error";
import { enforceRateLimit } from "../security/rate-limit";

/**
 * Base safe action client with error handling
 *
 * @description
 * The foundation client provides:
 * - Comprehensive error handling and logging
 * - User-friendly error messages in production
 * - Full error details in development
 * - No authentication or authorization requirements
 *
 * Use this for public actions that don't require user authentication.
 *
 * @example
 * ```ts
 * export const subscribeNewsletter = action
 *   .inputSchema(z.object({
 *     email: z.string().email(),
 *     name: z.string().optional()
 *   }))
 *   .action(async ({ parsedInput: { email, name } }) => {
 *     await addToNewsletter(email, name);
 *     return { subscribed: true };
 *   });
 * ```
 */
export const action = createSafeActionClient({
  handleServerError,
});

export const rateLimitedPublicAction = (
  key: string,
  limit = 5,
  windowSeconds = 60,
) =>
  createSafeActionClient({
    handleServerError,
  }).use(async ({ next }) => {
    const requestHeaders = await headers();
    const clientAddress =
      requestHeaders.get("x-forwarded-for")?.split(",").at(0)?.trim() ??
      requestHeaders.get("x-real-ip") ??
      "unknown";
    const fingerprint = createHash("sha256")
      .update(clientAddress)
      .digest("hex")
      .slice(0, 24);
    const result = await enforceRateLimit({
      key: `${key}:${fingerprint}`,
      limit,
      windowSeconds,
    });

    if (!result.allowed) {
      throw new ApplicationError(
        `Trop de requêtes. Réessaie dans ${result.retryAfterSeconds}s.`,
      );
    }

    return next();
  });

/**
 * Authenticated safe action client
 *
 * @description
 * - Validates user session using getRequiredUser()
 * - Throws ActionError if no valid session found
 * - Provides authenticated user in context as ctx.user
 * - Ensures all actions require valid authentication
 *
 * Use this for actions that require a logged-in user but no specific permissions.
 *
 * @example
 * ```ts
 * export const updateProfile = authAction
 *   .inputSchema(z.object({
 *     name: z.string().min(1),
 *     bio: z.string().optional(),
 *   }))
 *   .action(async ({ parsedInput: { name, bio }, ctx: { user } }) => {
 *     // user is guaranteed to be authenticated
 *     await updateUserProfile(user.id, { name, bio });
 *     return { updated: true };
 *   });
 * ```
 */
export const authAction = createSafeActionClient({
  handleServerError,
}).use(async ({ next }) => {
  const user = await getRequiredUser();

  return next({
    ctx: {
      user: user,
    },
  });
});

/**
 * Rate-limited authenticated safe action client
 *
 * @description
 * Same as authAction but with per-user rate limiting via Redis.
 * Use this for expensive operations: AI calls, exports, bulk operations.
 *
 * @param key - Unique identifier for the rate limit bucket (e.g. "ai-rewrite", "export-csv")
 * @param limit - Max requests allowed in the window (default: 10)
 * @param windowSeconds - Time window in seconds (default: 60)
 *
 * @example
 * ```ts
 * export const rewriteCvAction = rateLimitedAuthAction("cv-rewrite", 10, 60)
 *   .inputSchema(z.object({ text: z.string() }))
 *   .action(async ({ parsedInput, ctx: { user } }) => {
 *     // max 10 calls per minute per user
 *   });
 * ```
 */
export const rateLimitedAuthAction = (
  key: string,
  limit = 10,
  windowSeconds = 60,
) =>
  createSafeActionClient({
    handleServerError,
  }).use(async ({ next }) => {
    const user = await getRequiredUser();

    const result = await enforceRateLimit({
      key: `${key}:${user.id}`,
      limit,
      windowSeconds,
    });

    if (!result.allowed) {
      throw new ApplicationError(
        `Trop de requêtes. Réessaie dans ${result.retryAfterSeconds}s.`,
      );
    }

    return next({
      ctx: {
        user: user,
      },
    });
  });

function handleServerError(e: Error) {
  if (e instanceof ApplicationError) {
    logger.debug("[DEV] - Action Error", e.message);
    return e.message;
  }

  if (isNextPrerenderInterruptedError(e)) {
    return process.env.NODE_ENV === "development"
      ? e.message
      : "Request interrupted during prerendering.";
  }

  logger.info("Unknown Error", e);
  logSystemError({
    source: "safe-action",
    message: e.message,
    stack: e.stack,
    severity: "ERROR",
  });

  if (process.env.NODE_ENV === "development") {
    return e.message;
  }

  return "An unexpected error occurred.";
}
