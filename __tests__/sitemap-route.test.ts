import { describe, expect, it, vi } from "vitest";

const { findManyMock } = vi.hoisted(() => ({
  findManyMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    clientPortal: {
      findMany: findManyMock,
    },
  },
}));

import sitemap from "../app/sitemap";

describe("sitemap metadata route", () => {
  it("includes public pages, rss, blog posts and public portals", async () => {
    findManyMock.mockResolvedValue([
      { slug: "acme", updatedAt: new Date("2026-02-18T10:00:00.000Z") },
    ]);

    const entries = await sitemap();
    const urls = entries.map((entry: { url: string }) => entry.url);

    expect(urls).toEqual(
      expect.arrayContaining([
        "https://jobio.fr",
        "https://jobio.fr/features",
        "https://jobio.fr/blog",
        "https://jobio.fr/rss.xml",
        "https://jobio.fr/blog/5-conseils-prospection-freelance",
        "https://jobio.fr/p/acme",
      ]),
    );
  });

  it("stays resilient when portal lookup fails", async () => {
    findManyMock.mockRejectedValue(new Error("db unavailable"));

    const entries = await sitemap();
    const urls = entries.map((entry: { url: string }) => entry.url);

    expect(urls).toContain("https://jobio.fr/rss.xml");
    expect(urls.some((url: string) => url.includes("/p/"))).toBe(false);
  });
});
