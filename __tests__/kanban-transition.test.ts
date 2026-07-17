import { describe, expect, it } from "vitest";

import {
  applyOptimisticMissionStatus,
  applyOptimisticStatusCounters,
} from "@/features/missions/components/pipeline/kanban-transition";
import { resolveMissionStatusTransition } from "@/features/missions/mission-status-transition";

describe("kanban optimistic transition", () => {
  it("moves only the targeted mission", () => {
    const missions = [
      { id: "one", status: "A_POSTULER", title: "One" },
      { id: "two", status: "POSTULE", title: "Two" },
    ];

    expect(applyOptimisticMissionStatus(missions, "one", "ENTRETIEN")).toEqual([
      { id: "one", status: "ENTRETIEN", title: "One" },
      { id: "two", status: "POSTULE", title: "Two" },
    ]);
    expect(missions[0]?.status).toBe("A_POSTULER");
  });

  it("updates counters without allowing negative values", () => {
    expect(
      applyOptimisticStatusCounters(
        { A_POSTULER: 0, POSTULE: 2 },
        "A_POSTULER",
        "POSTULE",
      ),
    ).toMatchObject({ A_POSTULER: 0, POSTULE: 3 });
  });

  it("returns the same counters when no transition occurs", () => {
    const counters = { POSTULE: 2 };
    expect(applyOptimisticStatusCounters(counters, "POSTULE", "POSTULE")).toBe(
      counters,
    );
  });

  it("treats a replay as a no-op and rejects stale concurrent moves", () => {
    expect(
      resolveMissionStatusTransition({
        currentStatus: "POSTULE",
        nextStatus: "POSTULE",
        expectedStatus: "A_POSTULER",
      }),
    ).toBe("noop");
    expect(
      resolveMissionStatusTransition({
        currentStatus: "ENTRETIEN",
        nextStatus: "POSTULE",
        expectedStatus: "A_POSTULER",
      }),
    ).toBe("conflict");
    expect(
      resolveMissionStatusTransition({
        currentStatus: "A_POSTULER",
        nextStatus: "POSTULE",
        expectedStatus: "A_POSTULER",
      }),
    ).toBe("apply");
  });
});
