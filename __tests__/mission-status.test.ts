import {
  FOLLOW_UP_RECOMMENDED_STATUS_VALUES,
  MISSION_STATUS_LABELS,
  MISSION_STATUS_VALUES,
  PIPELINE_STATUS_VALUES,
  RESPONDED_STATUS_VALUES,
  STALE_ELIGIBLE_STATUS_VALUES,
  TERMINAL_MISSION_STATUS_VALUES,
} from "@/features/missions/mission-status";
import { describe, expect, it } from "vitest";

function hasDuplicates(values: readonly string[]) {
  return new Set(values).size !== values.length;
}

describe("mission-status constants", () => {
  it("should define labels for all statuses", () => {
    for (const status of MISSION_STATUS_VALUES) {
      expect(MISSION_STATUS_LABELS[status]).toBeTruthy();
    }
  });

  it("should not contain duplicate statuses in status groups", () => {
    expect(hasDuplicates(MISSION_STATUS_VALUES)).toBe(false);
    expect(hasDuplicates(PIPELINE_STATUS_VALUES)).toBe(false);
    expect(hasDuplicates(TERMINAL_MISSION_STATUS_VALUES)).toBe(false);
    expect(hasDuplicates(STALE_ELIGIBLE_STATUS_VALUES)).toBe(false);
    expect(hasDuplicates(FOLLOW_UP_RECOMMENDED_STATUS_VALUES)).toBe(false);
    expect(hasDuplicates(RESPONDED_STATUS_VALUES)).toBe(false);
  });

  it("should keep all derived groups as subset of all statuses", () => {
    const all = new Set(MISSION_STATUS_VALUES);
    const groups = [
      PIPELINE_STATUS_VALUES,
      TERMINAL_MISSION_STATUS_VALUES,
      STALE_ELIGIBLE_STATUS_VALUES,
      FOLLOW_UP_RECOMMENDED_STATUS_VALUES,
      RESPONDED_STATUS_VALUES,
    ];

    for (const group of groups) {
      for (const status of group) {
        expect(all.has(status)).toBe(true);
      }
    }
  });

  it("should keep terminal and stale statuses disjoint", () => {
    const terminal = new Set<string>(TERMINAL_MISSION_STATUS_VALUES);
    for (const status of STALE_ELIGIBLE_STATUS_VALUES) {
      expect(terminal.has(status)).toBe(false);
    }
  });
});
