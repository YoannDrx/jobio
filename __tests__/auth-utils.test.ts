import { getCallbackUrl, sanitizeCallbackUrl } from "@/lib/auth/auth-utils";
import { beforeEach, describe, expect, it } from "vitest";

const setLocationSearch = (search: string) => {
  Object.defineProperty(window, "location", {
    value: {
      origin: "http://localhost:3000",
      href: `http://localhost:3000/auth/signin${search}`,
      search,
    },
    writable: true,
  });
};

describe("sanitizeCallbackUrl", () => {
  it("accepts safe absolute paths", () => {
    expect(sanitizeCallbackUrl("/dashboard", "/job")).toBe("/dashboard");
  });

  it("normalizes relative paths", () => {
    expect(sanitizeCallbackUrl("dashboard", "/job")).toBe("/dashboard");
  });

  it("rejects external protocols", () => {
    expect(sanitizeCallbackUrl("https://evil.com", "/job")).toBe("/job");
    expect(sanitizeCallbackUrl("custom-scheme://evil.com", "/job")).toBe(
      "/job",
    );
  });

  it("rejects protocol-relative and malformed paths", () => {
    expect(sanitizeCallbackUrl("//evil.com", "/job")).toBe("/job");
    expect(sanitizeCallbackUrl("\\evil.com", "/job")).toBe("/job");
  });

  it("maps literal null to root", () => {
    expect(sanitizeCallbackUrl("null", "/job")).toBe("/");
  });

  it("falls back when callback is missing", () => {
    expect(sanitizeCallbackUrl(undefined, "/job")).toBe("/job");
    expect(sanitizeCallbackUrl(null, "/job")).toBe("/job");
  });
});

describe("getCallbackUrl", () => {
  beforeEach(() => {
    setLocationSearch("");
  });

  it("uses callbackUrl from query string when valid", () => {
    setLocationSearch("?callbackUrl=/account/billing");
    expect(getCallbackUrl("/job")).toBe("/account/billing");
  });

  it("falls back when query string callbackUrl is unsafe", () => {
    setLocationSearch("?callbackUrl=https://evil.com");
    expect(getCallbackUrl("/job")).toBe("/job");
  });

  it("uses provided callback when query string is missing", () => {
    setLocationSearch("");
    expect(getCallbackUrl("/job", "/dashboard")).toBe("/dashboard");
  });
});
