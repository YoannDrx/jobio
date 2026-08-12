import { fetchUrlContent } from "@/features/ai/url-fetcher";
import { assertPublicHostnameResolvesSafely } from "@/lib/security/public-url";
import { upfetch } from "@/lib/up-fetch";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type * as PublicUrlModule from "@/lib/security/public-url";

vi.mock("@/lib/security/public-url", async (importOriginal) => {
  const original = await importOriginal<typeof PublicUrlModule>();
  return {
    ...original,
    assertPublicHostnameResolvesSafely: vi.fn(),
  };
});
vi.mock("@/lib/up-fetch", () => ({ upfetch: vi.fn() }));

describe("URL fetcher security", () => {
  beforeEach(() => {
    vi.mocked(upfetch).mockReset();
    vi.mocked(assertPublicHostnameResolvesSafely).mockImplementation(
      async (value) => new URL(value),
    );
  });

  it("validates every redirect before issuing the next request", async () => {
    vi.mocked(assertPublicHostnameResolvesSafely).mockImplementation(
      async (value) => {
        if (value.includes("private.example")) throw new Error("private DNS");
        return new URL(value);
      },
    );
    vi.mocked(upfetch).mockImplementationOnce(async (_url, options) => {
      const parseResponse = options?.parseResponse;
      if (!parseResponse) throw new Error("Missing parser");
      return parseResponse(
        new Response(null, {
          status: 302,
          headers: { location: "https://private.example/secret" },
        }),
        {} as never,
      ) as never;
    });

    await expect(fetchUrlContent("https://public.example/job")).rejects.toThrow(
      /URL HTTPS publique/,
    );
    expect(upfetch).toHaveBeenCalledTimes(1);
    expect(assertPublicHostnameResolvesSafely).toHaveBeenCalledTimes(2);
  });

  it("rejects an oversized response before reading it", async () => {
    vi.mocked(upfetch).mockImplementationOnce(async (_url, options) => {
      const parseResponse = options?.parseResponse;
      if (!parseResponse) throw new Error("Missing parser");
      return parseResponse(
        new Response("small", {
          status: 200,
          headers: {
            "content-type": "text/html",
            "content-length": "1000001",
          },
        }),
        {} as never,
      ) as never;
    });

    await expect(fetchUrlContent("https://public.example/job")).rejects.toThrow(
      /trop volumineuse/,
    );
  });

  it("rejects unsupported content types", async () => {
    vi.mocked(upfetch).mockImplementationOnce(async (_url, options) => {
      const parseResponse = options?.parseResponse;
      if (!parseResponse) throw new Error("Missing parser");
      return parseResponse(
        new Response("binary", {
          status: 200,
          headers: { "content-type": "application/octet-stream" },
        }),
        {} as never,
      ) as never;
    });

    await expect(fetchUrlContent("https://public.example/job")).rejects.toThrow(
      /type de contenu/,
    );
  });
});
