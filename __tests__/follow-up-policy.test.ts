import { describe, expect, it } from "vitest";

import { evaluateFollowUpPolicy } from "@/features/follow-ups/follow-up-policy";

const allowedState = {
  missionStatus: "POSTULE" as const,
  isAutomated: false,
  contactTags: [] as string[],
  pendingNearTarget: 0,
  recentContactTouches: 0,
};

describe("follow-up policy", () => {
  it("blocks terminal missions and do-not-contact tags", () => {
    expect(
      evaluateFollowUpPolicy({ ...allowedState, missionStatus: "REFUSE" }),
    ).toBe("terminal_mission");
    expect(
      evaluateFollowUpPolicy({
        ...allowedState,
        contactTags: ["Désinscrit"],
      }),
    ).toBe("do_not_contact");
  });

  it("stops automation after a response while allowing a manual action", () => {
    expect(
      evaluateFollowUpPolicy({
        ...allowedState,
        missionStatus: "ENTRETIEN",
        isAutomated: true,
      }),
    ).toBe("response_received");
    expect(
      evaluateFollowUpPolicy({
        ...allowedState,
        missionStatus: "ENTRETIEN",
        isAutomated: false,
      }),
    ).toBeNull();
  });

  it("blocks duplicate windows and excessive contact frequency", () => {
    expect(
      evaluateFollowUpPolicy({ ...allowedState, pendingNearTarget: 1 }),
    ).toBe("duplicate_window");
    expect(
      evaluateFollowUpPolicy({ ...allowedState, recentContactTouches: 3 }),
    ).toBe("contact_frequency_limit");
  });
});
