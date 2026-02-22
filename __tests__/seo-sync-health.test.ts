import {
  computeSeoSyncFreshness,
  formatSyncAge,
  getLatestSeoSyncRun,
  getLatestSeoSyncSuccessRun,
} from "@/features/admin/seo-sync-health";
import { describe, expect, it } from "vitest";

const runs = [
  {
    jobName: "seo-search-metrics-sync",
    status: "FAILED" as const,
    startedAt: new Date("2026-02-20T08:00:00.000Z"),
  },
  {
    jobName: "seo-search-metrics-sync-manual",
    status: "SUCCESS" as const,
    startedAt: new Date("2026-02-21T10:30:00.000Z"),
  },
  {
    jobName: "billing-reminders",
    status: "SUCCESS" as const,
    startedAt: new Date("2026-02-22T09:00:00.000Z"),
  },
];

describe("seo sync health", () => {
  it("finds latest seo sync runs", () => {
    expect(getLatestSeoSyncRun(runs)?.jobName).toBe(
      "seo-search-metrics-sync-manual",
    );
    expect(getLatestSeoSyncSuccessRun(runs)?.status).toBe("SUCCESS");
  });

  it("computes freshness status from last success", () => {
    const now = new Date("2026-02-22T09:30:00.000Z");
    const fresh = computeSeoSyncFreshness(
      new Date("2026-02-22T08:00:00.000Z"),
      now,
    );
    const stale = computeSeoSyncFreshness(
      new Date("2026-02-19T08:00:00.000Z"),
      now,
    );
    const missing = computeSeoSyncFreshness(null, now);

    expect(fresh.status).toBe("fresh");
    expect(stale.status).toBe("stale");
    expect(missing.status).toBe("missing");
  });

  it("formats sync age labels", () => {
    expect(formatSyncAge(6)).toBe("6h");
    expect(formatSyncAge(50)).toBe("2j");
    expect(formatSyncAge(null)).toBe("-");
  });
});
