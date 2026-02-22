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

type MockFetchResponse = {
  ok: boolean;
  status: number;
  body: string;
};

const loadState = async ({
  envValues,
  fileContent,
  fileError,
  fetchResponse,
  fetchError,
}: {
  envValues: {
    SEO_SEARCH_METRICS_JSON?: string;
    SEO_SEARCH_METRICS_FILE?: string;
    SEO_SEARCH_METRICS_ENDPOINT?: string;
    SEO_SEARCH_METRICS_BEARER_TOKEN?: string;
    SEO_SEARCH_METRICS_TIMEOUT_MS?: number;
  };
  fileContent?: string;
  fileError?: Error;
  fetchResponse?: MockFetchResponse;
  fetchError?: Error;
}) => {
  const readFileMock = fileError
    ? vi.fn().mockRejectedValue(fileError)
    : vi.fn().mockResolvedValue(fileContent ?? "");

  const fetchMock = vi.fn();
  if (fetchError) {
    fetchMock.mockRejectedValue(fetchError);
  } else if (fetchResponse) {
    fetchMock.mockResolvedValue({
      ok: fetchResponse.ok,
      status: fetchResponse.status,
      text: async () => fetchResponse.body,
    });
  }

  vi.stubGlobal("fetch", fetchMock);

  vi.doMock("@/lib/env", () => ({
    env: {
      SEO_SEARCH_METRICS_JSON: envValues.SEO_SEARCH_METRICS_JSON,
      SEO_SEARCH_METRICS_FILE: envValues.SEO_SEARCH_METRICS_FILE,
      SEO_SEARCH_METRICS_ENDPOINT: envValues.SEO_SEARCH_METRICS_ENDPOINT,
      SEO_SEARCH_METRICS_BEARER_TOKEN: envValues.SEO_SEARCH_METRICS_BEARER_TOKEN,
      SEO_SEARCH_METRICS_TIMEOUT_MS: envValues.SEO_SEARCH_METRICS_TIMEOUT_MS,
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
    fetchMock,
  };
};

describe("loadSeoSearchMetricsState", () => {
  it("returns not_configured when no source is provided", async () => {
    const { state, readFileMock, fetchMock } = await loadState({
      envValues: {},
    });

    expect(state.status).toBe("not_configured");
    expect(state.source).toBe("none");
    expect(readFileMock).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("loads valid payload from env JSON", async () => {
    const { state, readFileMock, fetchMock } = await loadState({
      envValues: {
        SEO_SEARCH_METRICS_JSON: validPayload,
      },
    });

    expect(state.status).toBe("configured");
    expect(state.source).toBe("env_json");
    expect(state.payload?.current.totals.clicks).toBe(560);
    expect(readFileMock).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
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

  it("loads payload from endpoint when configured", async () => {
    const { state, fetchMock, readFileMock } = await loadState({
      envValues: {
        SEO_SEARCH_METRICS_ENDPOINT: "https://example.com/seo-snapshot",
        SEO_SEARCH_METRICS_BEARER_TOKEN: "secret-token",
        SEO_SEARCH_METRICS_TIMEOUT_MS: 5000,
      },
      fetchResponse: {
        ok: true,
        status: 200,
        body: validPayload,
      },
    });

    expect(state.status).toBe("configured");
    expect(state.source).toBe("endpoint");
    expect(state.payload?.current.totals.impressions).toBe(12000);
    expect(readFileMock).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const options = fetchMock.mock.calls[0][1];
    const headers = options?.headers as Headers;
    expect(headers.get("authorization")).toBe("Bearer secret-token");
  });

  it("returns invalid when endpoint returns non-2xx", async () => {
    const { state } = await loadState({
      envValues: {
        SEO_SEARCH_METRICS_ENDPOINT: "https://example.com/seo-snapshot",
      },
      fetchResponse: {
        ok: false,
        status: 503,
        body: "unavailable",
      },
    });

    expect(state.status).toBe("invalid");
    expect(state.source).toBe("endpoint");
    expect(state.error).toContain("503");
  });

  it("loads payload from file when file path is configured", async () => {
    const { state, readFileMock, fetchMock } = await loadState({
      envValues: {
        SEO_SEARCH_METRICS_FILE: "/tmp/seo-metrics.json",
      },
      fileContent: validPayload,
    });

    expect(state.status).toBe("configured");
    expect(state.source).toBe("file");
    expect(readFileMock).toHaveBeenCalledWith("/tmp/seo-metrics.json", "utf-8");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
