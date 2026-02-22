import { isNextPrerenderInterruptedError } from "@/lib/errors/next-prerender-interrupted";
import { describe, expect, it } from "vitest";

describe("isNextPrerenderInterruptedError", () => {
  it("detects expected Next prerender interruption markers", () => {
    const error = new Error(
      "Route /api/foo needs to bail out of prerendering at this point",
    );

    expect(isNextPrerenderInterruptedError(error)).toBe(true);
  });

  it("detects by digest marker when available", () => {
    const error = Object.assign(new Error("unexpected"), {
      digest: "NEXT_PRERENDER_INTERRUPTED",
    });

    expect(isNextPrerenderInterruptedError(error)).toBe(true);
  });

  it("ignores unrelated errors", () => {
    expect(
      isNextPrerenderInterruptedError(new Error("network timeout")),
    ).toBe(false);
    expect(isNextPrerenderInterruptedError("not-an-error")).toBe(false);
  });
});
