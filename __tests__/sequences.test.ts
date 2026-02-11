import {
  createSequenceSchema,
  sequenceStepSchema,
  updateSequenceSchema,
} from "@/features/sequences/sequences.schema";
import { describe, expect, it } from "vitest";

describe("sequenceStepSchema", () => {
  it("should accept a valid step", () => {
    const result = sequenceStepSchema.safeParse({
      delayDays: 3,
      type: "EMAIL",
      title: "Relance initiale",
    });
    expect(result.success).toBe(true);
  });

  it("should accept all valid types", () => {
    const types = ["EMAIL", "CALL", "MESSAGE", "MEETING"] as const;
    for (const type of types) {
      const result = sequenceStepSchema.safeParse({
        delayDays: 1,
        type,
        title: "Test",
      });
      expect(result.success).toBe(true);
    }
  });

  it("should reject invalid types", () => {
    const result = sequenceStepSchema.safeParse({
      delayDays: 1,
      type: "SMS",
      title: "Test",
    });
    expect(result.success).toBe(false);
  });

  it("should require delayDays >= 1", () => {
    const result = sequenceStepSchema.safeParse({
      delayDays: 0,
      type: "EMAIL",
      title: "Test",
    });
    expect(result.success).toBe(false);
  });

  it("should reject negative delayDays", () => {
    const result = sequenceStepSchema.safeParse({
      delayDays: -1,
      type: "EMAIL",
      title: "Test",
    });
    expect(result.success).toBe(false);
  });

  it("should reject non-integer delayDays", () => {
    const result = sequenceStepSchema.safeParse({
      delayDays: 1.5,
      type: "EMAIL",
      title: "Test",
    });
    expect(result.success).toBe(false);
  });

  it("should require title", () => {
    const result = sequenceStepSchema.safeParse({
      delayDays: 1,
      type: "EMAIL",
      title: "",
    });
    expect(result.success).toBe(false);
  });

  it("should allow optional templateId and subject", () => {
    const result = sequenceStepSchema.safeParse({
      delayDays: 3,
      type: "EMAIL",
      title: "Follow-up",
      templateId: "tmpl-123",
      subject: "Re: Mission",
    });
    expect(result.success).toBe(true);
  });
});

describe("createSequenceSchema", () => {
  it("should accept a valid sequence", () => {
    const result = createSequenceSchema.safeParse({
      name: "Sequence de relance standard",
      steps: [
        { delayDays: 3, type: "EMAIL", title: "Premier contact" },
        { delayDays: 7, type: "CALL", title: "Appel de suivi" },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("should require at least one step", () => {
    const result = createSequenceSchema.safeParse({
      name: "Sequence vide",
      steps: [],
    });
    expect(result.success).toBe(false);
  });

  it("should require a name", () => {
    const result = createSequenceSchema.safeParse({
      name: "",
      steps: [{ delayDays: 1, type: "EMAIL", title: "Test" }],
    });
    expect(result.success).toBe(false);
  });

  it("should allow optional description", () => {
    const result = createSequenceSchema.safeParse({
      name: "Ma séquence",
      description: "Description optionnelle",
      steps: [{ delayDays: 1, type: "EMAIL", title: "Test" }],
    });
    expect(result.success).toBe(true);
  });
});

describe("updateSequenceSchema", () => {
  it("should require an id", () => {
    const result = updateSequenceSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("should allow updating only the name", () => {
    const result = updateSequenceSchema.safeParse({
      id: "seq-123",
      name: "Nouveau nom",
    });
    expect(result.success).toBe(true);
  });

  it("should allow updating steps", () => {
    const result = updateSequenceSchema.safeParse({
      id: "seq-123",
      steps: [
        { delayDays: 1, type: "EMAIL", title: "Step 1" },
        { delayDays: 5, type: "CALL", title: "Step 2" },
      ],
    });
    expect(result.success).toBe(true);
  });
});
