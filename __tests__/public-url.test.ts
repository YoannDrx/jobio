import {
  isSafePublicHttpsUrl,
  isPrivateOrReservedIp,
  safePublicHttpsUrlSchema,
} from "@/lib/security/public-url";
import { describe, expect, it } from "vitest";

describe("safe public URL", () => {
  it("accepts public HTTPS URLs", () => {
    expect(isSafePublicHttpsUrl("https://www.example.com/logo.png")).toBe(true);
    expect(
      safePublicHttpsUrlSchema.safeParse("https://cdn.example.com/a.png")
        .success,
    ).toBe(true);
  });

  it.each([
    "http://example.com",
    "https://localhost/image.png",
    "https://127.0.0.1/image.png",
    "https://10.0.0.1/image.png",
    "https://192.168.1.10/image.png",
    "https://[::1]/image.png",
    "https://user:secret@example.com/image.png",
    "not-a-url",
  ])("rejects unsafe URL %s", (url) => {
    expect(isSafePublicHttpsUrl(url)).toBe(false);
  });

  it.each([
    "10.0.0.1",
    "100.64.0.1",
    "127.0.0.1",
    "169.254.1.1",
    "172.16.0.1",
    "192.168.0.1",
    "::1",
    "fd00::1",
    "fe80::1",
    "::ffff:127.0.0.1",
    "::ffff:7f00:1",
    "2001:db8::1",
    "ff02::1",
    "192.0.2.1",
    "198.51.100.10",
    "203.0.113.10",
  ])("recognizes private or reserved IP %s", (address) => {
    expect(isPrivateOrReservedIp(address)).toBe(true);
  });
});
