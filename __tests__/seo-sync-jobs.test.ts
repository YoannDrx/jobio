import { SEO_SYNC_JOB_NAMES, isSeoSyncJobName } from "@/features/admin/seo-sync-jobs";
import { describe, expect, it } from "vitest";

describe("seo sync jobs", () => {
  it("exposes expected SEO sync job names", () => {
    expect(SEO_SYNC_JOB_NAMES).toContain("seo-search-metrics-sync");
    expect(SEO_SYNC_JOB_NAMES).toContain("seo-search-metrics-sync-manual");
  });

  it("detects seo sync job names", () => {
    expect(isSeoSyncJobName("seo-search-metrics-sync")).toBe(true);
    expect(isSeoSyncJobName("seo-search-metrics-sync-manual")).toBe(true);
    expect(isSeoSyncJobName("analytics-snapshot")).toBe(false);
  });
});
