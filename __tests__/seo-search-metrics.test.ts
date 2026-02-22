import { afterEach, describe, expect, it, vi } from "vitest";

const validPayload = JSON.stringify({
  current: {
    provider: "google_search_console",
    capturedAt: "2026-02-22T09:00:00.000Z",
    period: {
      from: "2026-01-26",
      to: "2026-02-22",
      label: "28 derniers jours",
    },
    totals: {
      clicks: 560,
      impressions: 12000,
      ctr: 0.046,
      averagePosition: 15.4,
    },
    indexedPages: {
      public: 41,
      private: 0,
    },
    topQueries: [
      {
        query: "crm freelance",
        clicks: 73,
        impressions: 900,
        ctr: 0.081,
        position: 8.2,
      },
    ],
  },
});

afterEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

const loadState = async ({
  envValues,
  fileContent,
  fileError,
}: {
  envValues: {
    SEO_SEARCH_METRICS_JSON?: string;
    SEO_SEARCH_METRICS_FILE?: string;
  };
  fileContent?: string;
  fileError?: Error;
}) => {
  const readFileMock = fileError
    ? vi.fn().mockRejectedValue(fileError)
    : vi.fn().mockResolvedValue(fileContent ?? "");

  vi.doMock("@/lib/env", () => ({
    env: {
      SEO_SEARCH_METRICS_JSON: envValues.SEO_SEARCH_METRICS_JSON,
      SEO_SEARCH_METRICS_FILE: envValues.SEO_SEARCH_METRICS_FILE,
    },
  }));

  vi.doMock("node:fs/promises", () => ({
    readFile: readFileMock,
    default: {
      readFile: readFileMock,
    },
  }));

  const seoMetricsModule = await import("@/features/admin/seo-search-metrics");

  return {
    state: await seoMetricsModule.loadSeoSearchMetricsState(),
    readFileMock,
  };
};

describe("loadSeoSearchMetricsState", () => {
  it("returns not_configured when no source is provided", async () => {
    const { state, readFileMock } = await loadState({
      envValues: {},
    });

    expect(state.status).toBe("not_configured");
    expect(state.source).toBe("none");
    expect(readFileMock).not.toHaveBeenCalled();
  });

  it("loads valid payload from env JSON", async () => {
    const { state, readFileMock } = await loadState({
      envValues: {
        SEO_SEARCH_METRICS_JSON: validPayload,
      },
    });

    expect(state.status).toBe("configured");
    expect(state.source).toBe("env_json");
    expect(state.payload?.current.totals.clicks).toBe(560);
    expect(readFileMock).not.toHaveBeenCalled();
  });

  it("returns invalid when env JSON is malformed", async () => {
    const { state } = await loadState({
      envValues: {
        SEO_SEARCH_METRICS_JSON: "{invalid-json}",
      },
    });

    expect(state.status).toBe("invalid");
    expect(state.source).toBe("env_json");
    expect(state.error).toBeTruthy();
  });

  it("loads payload from file when file path is configured", async () => {
    const { state, readFileMock } = await loadState({
      envValues: {
        SEO_SEARCH_METRICS_FILE: "/tmp/seo-metrics.json",
      },
      fileContent: validPayload,
    });

    expect(state.status).toBe("configured");
    expect(state.source).toBe("file");
    expect(readFileMock).toHaveBeenCalledWith("/tmp/seo-metrics.json", "utf-8");
  });
});
