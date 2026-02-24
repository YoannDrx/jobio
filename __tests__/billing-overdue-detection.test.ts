import { describe, it, expect } from "vitest";

// Pure functions to test detection logic
const computeDaysOverdue = (dueDate: Date, today: Date): number => {
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const t = new Date(today);
  t.setHours(0, 0, 0, 0);
  return Math.max(
    0,
    Math.floor((t.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)),
  );
};

const isMilestone = (daysOverdue: number): boolean => {
  return [1, 7, 14, 30].includes(daysOverdue);
};

const isOverdue = (
  status: string,
  dueDate: Date | null,
  today: Date,
): boolean => {
  if (!dueDate) return false;
  if (status !== "ISSUED" && status !== "PARTIALLY_PAID") return false;
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const t = new Date(today);
  t.setHours(0, 0, 0, 0);
  return t.getTime() > due.getTime();
};

describe("computeDaysOverdue", () => {
  it("should return correct days for normal case", () => {
    const dueDate = new Date("2024-01-01");
    const today = new Date("2024-01-08");
    expect(computeDaysOverdue(dueDate, today)).toBe(7);
  });

  it("should return 0 for same day", () => {
    const date = new Date("2024-01-15");
    expect(computeDaysOverdue(date, date)).toBe(0);
  });

  it("should return 0 when not yet due", () => {
    const dueDate = new Date("2024-01-15");
    const today = new Date("2024-01-10");
    expect(computeDaysOverdue(dueDate, today)).toBe(0);
  });
});

describe("isMilestone", () => {
  it("should return true for milestone days", () => {
    expect(isMilestone(1)).toBe(true);
    expect(isMilestone(7)).toBe(true);
    expect(isMilestone(14)).toBe(true);
    expect(isMilestone(30)).toBe(true);
  });

  it("should return false for non-milestone days", () => {
    expect(isMilestone(0)).toBe(false);
    expect(isMilestone(2)).toBe(false);
    expect(isMilestone(5)).toBe(false);
    expect(isMilestone(10)).toBe(false);
    expect(isMilestone(15)).toBe(false);
    expect(isMilestone(31)).toBe(false);
  });
});

describe("isOverdue", () => {
  it("should detect overdue ISSUED invoice", () => {
    expect(
      isOverdue("ISSUED", new Date("2024-01-01"), new Date("2024-01-02")),
    ).toBe(true);
  });

  it("should detect overdue PARTIALLY_PAID invoice", () => {
    expect(
      isOverdue(
        "PARTIALLY_PAID",
        new Date("2024-01-01"),
        new Date("2024-01-02"),
      ),
    ).toBe(true);
  });

  it("should not detect DRAFT as overdue", () => {
    expect(
      isOverdue("DRAFT", new Date("2024-01-01"), new Date("2024-01-02")),
    ).toBe(false);
  });

  it("should not detect CANCELLED as overdue", () => {
    expect(
      isOverdue("CANCELLED", new Date("2024-01-01"), new Date("2024-01-02")),
    ).toBe(false);
  });

  it("should not detect PAID as overdue", () => {
    expect(
      isOverdue("PAID", new Date("2024-01-01"), new Date("2024-01-02")),
    ).toBe(false);
  });

  it("should not detect as overdue when due date is today", () => {
    expect(
      isOverdue("ISSUED", new Date("2024-01-15"), new Date("2024-01-15")),
    ).toBe(false);
  });

  it("should not detect as overdue when no due date", () => {
    expect(isOverdue("ISSUED", null, new Date("2024-01-15"))).toBe(false);
  });

  it("should not detect as overdue when due date is in the future", () => {
    expect(
      isOverdue("ISSUED", new Date("2024-01-20"), new Date("2024-01-15")),
    ).toBe(false);
  });
});
