import { describe, expect, it } from "vitest";

import { buildTodayPriorities } from "@/features/missions/components/today/today-priorities";

const followUp = (id: string) => ({
  id,
  title: `Relance ${id}`,
  scheduledAt: "2026-07-16T08:00:00.000Z",
  mission: {
    id: `mission-${id}`,
    title: `Mission ${id}`,
    company: "Acme",
  },
});

describe("today priorities", () => {
  it("keeps only the three most urgent actionable items", () => {
    const priorities = buildTodayPriorities({
      overdueFollowUps: [followUp("overdue-1"), followUp("overdue-2")],
      todayFollowUps: [followUp("today-1"), followUp("today-2")],
      staleMissions: [
        {
          id: "stale-1",
          title: "Mission stale",
          company: null,
          updatedAt: "2026-06-01T08:00:00.000Z",
        },
      ],
      suggestions: [
        {
          id: "suggestion-1",
          type: "no_contact",
          message: "Ajouter un contact",
          link: "/job/contacts",
        },
      ],
    });

    expect(priorities).toHaveLength(3);
    expect(priorities.map((priority) => priority.kind)).toEqual([
      "overdue",
      "overdue",
      "today",
    ]);
  });
});
