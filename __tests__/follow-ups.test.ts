import {
  completeFollowUpSchema,
  createFollowUpSchema,
  followUpTypeSchema,
  snoozeFollowUpSchema,
  updateFollowUpSchema,
} from "@/features/follow-ups/follow-ups.schema";
import { describe, expect, it } from "vitest";

describe("followUpTypeSchema", () => {
  it("should accept all valid types", () => {
    const types = ["EMAIL", "CALL", "MESSAGE", "MEETING"] as const;
    for (const type of types) {
      const result = followUpTypeSchema.safeParse(type);
      expect(result.success).toBe(true);
    }
  });

  it("should reject invalid types", () => {
    const result = followUpTypeSchema.safeParse("SMS");
    expect(result.success).toBe(false);
  });
});

describe("createFollowUpSchema", () => {
  it("should accept a valid follow-up", () => {
    const result = createFollowUpSchema.safeParse({
      missionId: "mission-123",
      type: "EMAIL",
      title: "Relance candidature",
      scheduledAt: new Date("2026-03-01T10:00:00Z"),
    });
    expect(result.success).toBe(true);
  });

  it("should require missionId", () => {
    const result = createFollowUpSchema.safeParse({
      type: "EMAIL",
      title: "Test",
      scheduledAt: new Date(),
    });
    expect(result.success).toBe(false);
  });

  it("should require title", () => {
    const result = createFollowUpSchema.safeParse({
      missionId: "mission-123",
      type: "EMAIL",
      title: "",
      scheduledAt: new Date(),
    });
    expect(result.success).toBe(false);
  });

  it("should require scheduledAt", () => {
    const result = createFollowUpSchema.safeParse({
      missionId: "mission-123",
      type: "EMAIL",
      title: "Test",
    });
    expect(result.success).toBe(false);
  });

  it("should coerce string dates to Date", () => {
    const result = createFollowUpSchema.safeParse({
      missionId: "mission-123",
      type: "CALL",
      title: "Appel",
      scheduledAt: "2026-03-01T10:00:00Z",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.scheduledAt).toBeInstanceOf(Date);
    }
  });

  it("should allow optional description and templateId", () => {
    const result = createFollowUpSchema.safeParse({
      missionId: "mission-123",
      type: "EMAIL",
      title: "Test",
      scheduledAt: new Date(),
      description: "Description optionnelle",
      templateId: "tmpl-456",
    });
    expect(result.success).toBe(true);
  });
});

describe("snoozeFollowUpSchema", () => {
  it("should accept valid snooze data", () => {
    const result = snoozeFollowUpSchema.safeParse({
      id: "fu-123",
      scheduledAt: new Date("2026-04-01T10:00:00Z"),
    });
    expect(result.success).toBe(true);
  });

  it("should require id", () => {
    const result = snoozeFollowUpSchema.safeParse({
      scheduledAt: new Date("2026-04-01T10:00:00Z"),
    });
    expect(result.success).toBe(false);
  });

  it("should require scheduledAt", () => {
    const result = snoozeFollowUpSchema.safeParse({
      id: "fu-123",
    });
    expect(result.success).toBe(false);
  });

  it("should coerce string date to Date", () => {
    const result = snoozeFollowUpSchema.safeParse({
      id: "fu-123",
      scheduledAt: "2026-04-01T10:00:00Z",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.scheduledAt).toBeInstanceOf(Date);
    }
  });
});

describe("completeFollowUpSchema", () => {
  it("should accept valid data", () => {
    const result = completeFollowUpSchema.safeParse({ id: "fu-123" });
    expect(result.success).toBe(true);
  });

  it("should require id", () => {
    const result = completeFollowUpSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("updateFollowUpSchema", () => {
  it("should require id", () => {
    const result = updateFollowUpSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("should allow partial updates", () => {
    const result = updateFollowUpSchema.safeParse({
      id: "fu-123",
      title: "Nouveau titre",
    });
    expect(result.success).toBe(true);
  });

  it("should allow updating type", () => {
    const result = updateFollowUpSchema.safeParse({
      id: "fu-123",
      type: "CALL",
    });
    expect(result.success).toBe(true);
  });

  it("should allow nullable templateId", () => {
    const result = updateFollowUpSchema.safeParse({
      id: "fu-123",
      templateId: null,
    });
    expect(result.success).toBe(true);
  });
});
