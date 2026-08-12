import {
  PRO_TRIAL_DAYS,
  getProTrialEndsAt,
  getTrialEmailFingerprint,
} from "@/lib/auth/stripe/pro-trial";
import { describe, expect, it } from "vitest";

describe("app-managed Pro trial", () => {
  it("ends exactly fourteen days after it starts", () => {
    const start = new Date("2026-08-07T12:00:00.000Z");
    expect(PRO_TRIAL_DAYS).toBe(14);
    expect(getProTrialEndsAt(start).toISOString()).toBe(
      "2026-08-21T12:00:00.000Z",
    );
  });

  it("normalizes email identity without storing the email", () => {
    const first = getTrialEmailFingerprint(" Freelance@Example.com ");
    const second = getTrialEmailFingerprint("freelance@example.com");
    expect(first).toBe(second);
    expect(first).toMatch(/^[a-f0-9]{64}$/);
    expect(first).not.toContain("freelance");
  });
});
