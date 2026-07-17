export type DeliveryEventType =
  | "email.delivered"
  | "email.opened"
  | "email.clicked"
  | "email.bounced"
  | "email.complained"
  | "email.suppressed";

const STATUS_PRIORITY: Record<string, number> = {
  draft: 0,
  pending: 1,
  sending: 2,
  sent: 3,
  delivered: 4,
  opened: 5,
  clicked: 6,
  failed: 7,
  bounced: 8,
  suppressed: 9,
  complained: 10,
};

const EVENT_STATUS: Record<DeliveryEventType, string> = {
  "email.delivered": "delivered",
  "email.opened": "opened",
  "email.clicked": "clicked",
  "email.bounced": "bounced",
  "email.complained": "complained",
  "email.suppressed": "suppressed",
};

export const getDeliveryEventUpdate = (params: {
  currentStatus: string;
  eventType: string;
  occurredAt: Date;
}) => {
  if (!(params.eventType in EVENT_STATUS)) return null;

  const eventType = params.eventType as DeliveryEventType;
  const nextStatus = EVENT_STATUS[eventType];
  const status =
    (STATUS_PRIORITY[nextStatus] ?? 0) >=
    (STATUS_PRIORITY[params.currentStatus] ?? 0)
      ? nextStatus
      : params.currentStatus;

  switch (eventType) {
    case "email.delivered":
      return { status, deliveredAt: params.occurredAt };
    case "email.opened":
      return { status, openedAt: params.occurredAt };
    case "email.clicked":
      return { status, clickedAt: params.occurredAt };
    case "email.bounced":
      return { status, bouncedAt: params.occurredAt };
    case "email.complained":
      return { status, complainedAt: params.occurredAt };
    case "email.suppressed":
      return { status, suppressedAt: params.occurredAt };
  }
};
