import { describe, expect, it } from "vitest";

import {
  evaluateOutreachWindow,
  isAcceptedEmailStatus,
  sanitizeProviderFailure,
} from "@/features/emails/outreach-policy";

describe("outreach email policy", () => {
  it("allows working hours in the supplied local time zone", () => {
    expect(
      evaluateOutreachWindow(
        new Date("2026-07-17T08:00:00.000Z"),
        "Europe/Paris",
      ),
    ).toBeNull();
  });

  it("blocks weekends and hours outside the local send window", () => {
    expect(
      evaluateOutreachWindow(
        new Date("2026-07-18T10:00:00.000Z"),
        "Europe/Paris",
      ),
    ).toBe("outside_business_days");
    expect(
      evaluateOutreachWindow(
        new Date("2026-07-17T17:30:00.000Z"),
        "Europe/Paris",
      ),
    ).toBe("outside_business_hours");
  });

  it("rejects invalid time zones", () => {
    expect(evaluateOutreachWindow(new Date(), "Europe/Nowhere")).toBe(
      "invalid_time_zone",
    );
  });

  it("counts only provider-accepted statuses as contact touches", () => {
    expect(isAcceptedEmailStatus("sent")).toBe(true);
    expect(isAcceptedEmailStatus("delivered")).toBe(true);
    expect(isAcceptedEmailStatus("failed")).toBe(false);
    expect(isAcceptedEmailStatus("draft")).toBe(false);
  });

  it("stores a bounded single-line provider failure", () => {
    expect(sanitizeProviderFailure("  API\n unavailable  ")).toBe(
      "API  unavailable",
    );
    expect(sanitizeProviderFailure("x".repeat(700))).toHaveLength(500);
  });
});
