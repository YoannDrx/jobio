import {
  getProductFeatureForPath,
  isPlanAvailableForNewSubscription,
  isProductPathAvailable,
} from "@/config/product-features";
import { describe, expect, it } from "vitest";

describe("Jobio product feature manifest", () => {
  it("keeps the product destinations available", () => {
    expect(isProductPathAvailable("/job")).toBe(true);
    expect(isProductPathAvailable("/job/pipeline/mission-1")).toBe(true);
    expect(isProductPathAvailable("/job/follow-ups")).toBe(true);
    expect(isProductPathAvailable("/job/cv-studio")).toBe(true);
    expect(isProductPathAvailable("/job/contacts")).toBe(true);
  });

  it("publishes the complete suite, including deep links", () => {
    expect(getProductFeatureForPath("/job/programmes/example")).toBe(
      "programmes",
    );
    expect(isProductPathAvailable("/job/programmes/example")).toBe(true);
    expect(isProductPathAvailable("/freelance/invoices")).toBe(true);
  });

  it("only sells Pro to new subscribers", () => {
    expect(isPlanAvailableForNewSubscription("pro")).toBe(true);
    expect(isPlanAvailableForNewSubscription("ultra")).toBe(false);
    expect(isPlanAvailableForNewSubscription("free")).toBe(false);
  });
});
