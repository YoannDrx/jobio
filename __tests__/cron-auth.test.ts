import { validateCronAuthorization } from "@/lib/security/cron-auth";
import { describe, expect, it } from "vitest";

describe("validateCronAuthorization", () => {
  it("fails when CRON_SECRET is missing", () => {
    const result = validateCronAuthorization("Bearer token", "");

    expect(result).toEqual({
      status: 503,
      publicError: "Service unavailable",
      logMessage: "CRON_SECRET is not configured",
    });
  });

  it("fails on invalid/missing bearer token", () => {
    expect(validateCronAuthorization(null, "super-secret-token")?.status).toBe(
      401,
    );
    expect(
      validateCronAuthorization(
        "Bearer wrong-token",
        "super-secret-token",
      )?.status,
    ).toBe(401);
  });

  it("authorizes with exact bearer token", () => {
    expect(
      validateCronAuthorization("Bearer super-secret-token", "super-secret-token"),
    ).toBeNull();
  });
});
