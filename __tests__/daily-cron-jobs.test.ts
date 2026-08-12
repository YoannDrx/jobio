import { DAILY_CRON_JOBS } from "@/lib/ops/daily-cron-jobs";
import { describe, expect, it } from "vitest";

describe("daily cron jobs", () => {
  it("uses the HTTP method exported by each route handler", () => {
    expect(DAILY_CRON_JOBS).toHaveLength(8);
    expect(DAILY_CRON_JOBS).toEqual(
      expect.arrayContaining([
        { path: "/api/cron/analytics-snapshot", method: "POST" },
        { path: "/api/cron/seo-search-metrics-sync", method: "POST" },
        { path: "/api/cron/opportunity-sync", method: "GET" },
      ]),
    );

    expect(
      DAILY_CRON_JOBS.filter(({ method }) => method === "GET"),
    ).toHaveLength(6);
  });

  it("does not register duplicate routes", () => {
    const paths = DAILY_CRON_JOBS.map(({ path }) => path);

    expect(new Set(paths).size).toBe(paths.length);
  });
});
