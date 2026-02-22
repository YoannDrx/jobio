import { GET } from "../app/rss.xml/route";
import { describe, expect, it } from "vitest";

describe("rss route", () => {
  it("returns a valid RSS feed with blog links", async () => {
    const response = await GET();
    const body = await response.text();

    expect(response.headers.get("content-type")).toContain(
      "application/rss+xml",
    );
    expect(body).toContain("<rss version=\"2.0\"");
    expect(body).toContain("https://jobio.fr/blog");
    expect(body).toContain(
      "https://jobio.fr/blog/5-conseils-prospection-freelance",
    );
  });
});
