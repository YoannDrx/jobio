import { describe, expect, it } from "vitest";

import { getDeliveryEventUpdate } from "@/features/emails/delivery-status";

describe("email delivery status", () => {
  const occurredAt = new Date("2026-07-17T10:00:00.000Z");

  it("maps provider events to a status and timestamp", () => {
    expect(
      getDeliveryEventUpdate({
        currentStatus: "sent",
        eventType: "email.delivered",
        occurredAt,
      }),
    ).toEqual({ status: "delivered", deliveredAt: occurredAt });
    expect(
      getDeliveryEventUpdate({
        currentStatus: "sent",
        eventType: "email.suppressed",
        occurredAt,
      }),
    ).toEqual({ status: "suppressed", suppressedAt: occurredAt });
  });

  it("does not regress the visible status when webhooks arrive out of order", () => {
    expect(
      getDeliveryEventUpdate({
        currentStatus: "clicked",
        eventType: "email.delivered",
        occurredAt,
      }),
    ).toEqual({ status: "clicked", deliveredAt: occurredAt });
    expect(
      getDeliveryEventUpdate({
        currentStatus: "bounced",
        eventType: "email.opened",
        occurredAt,
      }),
    ).toEqual({ status: "bounced", openedAt: occurredAt });
  });

  it("ignores webhook events outside the tracked delivery lifecycle", () => {
    expect(
      getDeliveryEventUpdate({
        currentStatus: "sent",
        eventType: "email.sent",
        occurredAt,
      }),
    ).toBeNull();
  });
});
