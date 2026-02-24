import robots from "../app/robots";
import { describe, expect, it } from "vitest";

describe("robots metadata route", () => {
  it("disallows private spaces and exposes sitemap", () => {
    const metadata = robots();
    const rule = Array.isArray(metadata.rules)
      ? metadata.rules[0]
      : metadata.rules;

    expect(rule).toBeDefined();
    expect(rule.userAgent).toBe("*");
    expect(rule.disallow).toEqual(
      expect.arrayContaining([
        "/admin",
        "/api",
        "/auth",
        "/job",
        "/freelance",
      ]),
    );
    expect(metadata.sitemap).toBe("https://jobio.fr/sitemap.xml");
    expect(metadata.host).toBe("https://jobio.fr");
  });
});
