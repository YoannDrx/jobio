import { getPrismaDatasourceUrl } from "@/lib/prisma-url";
import { describe, expect, it } from "vitest";

describe("Prisma datasource URL", () => {
  it("bounds the default PostgreSQL pool for serverless runtimes", () => {
    const result = new URL(
      getPrismaDatasourceUrl("postgresql://user:secret@example.com/jobio") ??
        "",
    );
    expect(result.searchParams.get("connection_limit")).toBe("3");
    expect(result.searchParams.get("pool_timeout")).toBe("20");
  });

  it("preserves explicit operator settings and invalid URLs", () => {
    const configured = new URL(
      getPrismaDatasourceUrl(
        "postgresql://user:secret@example.com/jobio?connection_limit=4&pool_timeout=9",
      ) ?? "",
    );
    expect(configured.searchParams.get("connection_limit")).toBe("4");
    expect(configured.searchParams.get("pool_timeout")).toBe("9");
    expect(getPrismaDatasourceUrl("not-a-url")).toBe("not-a-url");
  });
});
