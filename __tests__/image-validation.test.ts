import {
  extensionForImageMimeType,
  hasValidImageSignature,
} from "@/lib/files/image-validation";
import { describe, expect, it } from "vitest";

describe("image upload validation", () => {
  it("accepts a matching PNG signature", async () => {
    const file = new File(
      [new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0])],
      "renamed.html",
      { type: "image/png" },
    );
    await expect(hasValidImageSignature(file)).resolves.toBe(true);
    expect(extensionForImageMimeType(file.type)).toBe("png");
  });

  it("rejects spoofed images and SVG", async () => {
    const spoofed = new File(["<script>alert(1)</script>"], "attack.png", {
      type: "image/png",
    });
    const svg = new File(["<svg><script /></svg>"], "attack.svg", {
      type: "image/svg+xml",
    });
    await expect(hasValidImageSignature(spoofed)).resolves.toBe(false);
    await expect(hasValidImageSignature(svg)).resolves.toBe(false);
  });
});
