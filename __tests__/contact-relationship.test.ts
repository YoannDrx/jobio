import {
  computeContactRelationship,
  type ContactRelationship,
} from "@/features/contacts/contact-relationship";
import { describe, expect, it } from "vitest";

function assertRelationship(result: ContactRelationship): void {
  expect(result.score).toBeGreaterThanOrEqual(0);
  expect(result.score).toBeLessThanOrEqual(100);
  expect(["hot", "warm", "cold"]).toContain(result.tier);
  expect(result.nextAction.length).toBeGreaterThan(0);
}

describe("computeContactRelationship", () => {
  it("returns hot tier for recent and active contacts", () => {
    const now = new Date("2026-02-14T10:00:00.000Z");
    const result = computeContactRelationship({
      missionCount: 3,
      interactionCount: 9,
      lastInteractionAt: new Date("2026-02-13T09:00:00.000Z"),
      now,
    });

    assertRelationship(result);
    expect(result.tier).toBe("hot");
    expect(result.daysSinceLastInteraction).toBe(1);
  });

  it("returns warm tier for moderately active contacts", () => {
    const now = new Date("2026-02-14T10:00:00.000Z");
    const result = computeContactRelationship({
      missionCount: 1,
      interactionCount: 3,
      lastInteractionAt: new Date("2026-02-06T10:00:00.000Z"),
      now,
    });

    assertRelationship(result);
    expect(result.tier).toBe("warm");
  });

  it("returns cold tier when no interaction exists", () => {
    const result = computeContactRelationship({
      missionCount: 0,
      interactionCount: 0,
      lastInteractionAt: null,
      now: new Date("2026-02-14T10:00:00.000Z"),
    });

    assertRelationship(result);
    expect(result.tier).toBe("cold");
    expect(result.nextAction).toContain("premier contact");
    expect(result.daysSinceLastInteraction).toBeNull();
  });
});
