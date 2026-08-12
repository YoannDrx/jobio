import type {
  BillingAuditEventType,
  BillingEntityType,
  Prisma,
} from "@/generated/prisma";

export type BillingAuditPayload = {
  userId: string;
  entityType: BillingEntityType;
  entityId: string;
  eventType: BillingAuditEventType;
  message?: string;
  metadata?: Prisma.InputJsonValue;
};

export const createBillingAuditEvent = async (
  tx: Prisma.TransactionClient,
  payload: BillingAuditPayload,
) => {
  await tx.billingAuditEvent.create({
    data: {
      userId: payload.userId,
      entityType: payload.entityType,
      entityId: payload.entityId,
      eventType: payload.eventType,
      message: payload.message,
      metadata: payload.metadata,
    },
  });
};

const toJsonSafe = (value: unknown) => {
  return JSON.parse(
    JSON.stringify(value, (_key, candidate) => {
      if (candidate instanceof Date) {
        return candidate.toISOString();
      }
      if (typeof candidate === "bigint") {
        return candidate.toString();
      }
      return candidate;
    }),
  ) as Prisma.InputJsonValue;
};

export const buildBeforeAfterMetadata = (input: {
  before: unknown;
  after: unknown;
  extra?: Record<string, unknown>;
}) => {
  const before = toJsonSafe(input.before) as Record<string, unknown> | null;
  const after = toJsonSafe(input.after) as Record<string, unknown> | null;

  const beforeRecord =
    before && typeof before === "object" && !Array.isArray(before)
      ? before
      : null;
  const afterRecord =
    after && typeof after === "object" && !Array.isArray(after) ? after : null;

  const changedFields =
    beforeRecord && afterRecord
      ? Array.from(
          new Set([...Object.keys(beforeRecord), ...Object.keys(afterRecord)]),
        ).filter((field) => {
          return (
            JSON.stringify(beforeRecord[field] ?? null) !==
            JSON.stringify(afterRecord[field] ?? null)
          );
        })
      : [];

  const extra =
    input.extra && typeof input.extra === "object"
      ? (toJsonSafe(input.extra) as Record<string, Prisma.InputJsonValue>)
      : {};

  return {
    before,
    after,
    changedFields,
    ...extra,
  } as Prisma.InputJsonValue;
};
