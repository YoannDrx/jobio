import { describe, it, expect } from "vitest";
import { computeNextInvoiceDate } from "@/features/freelance/billing-recurring-utils";

describe("computeNextInvoiceDate", () => {
  it("should add 1 month for MONTHLY", () => {
    const result = computeNextInvoiceDate(new Date("2024-01-15"), "MONTHLY");
    expect(result.getFullYear()).toBe(2024);
    expect(result.getMonth()).toBe(1); // February
    expect(result.getDate()).toBe(15);
  });

  it("should handle month overflow for MONTHLY (Jan 31 -> Feb 29 leap year)", () => {
    const result = computeNextInvoiceDate(new Date("2024-01-31"), "MONTHLY");
    expect(result.getFullYear()).toBe(2024);
    expect(result.getMonth()).toBe(1); // February
    expect(result.getDate()).toBe(29); // 2024 is a leap year
  });

  it("should handle month overflow for MONTHLY (Jan 31 -> Feb 28 non-leap year)", () => {
    const result = computeNextInvoiceDate(new Date("2025-01-31"), "MONTHLY");
    expect(result.getFullYear()).toBe(2025);
    expect(result.getMonth()).toBe(1); // February
    expect(result.getDate()).toBe(28);
  });

  it("should handle month overflow for QUARTERLY (Jan 31 -> Apr 30)", () => {
    const result = computeNextInvoiceDate(new Date("2024-01-31"), "QUARTERLY");
    expect(result.getFullYear()).toBe(2024);
    expect(result.getMonth()).toBe(3); // April
    expect(result.getDate()).toBe(30);
  });

  it("should handle year transition for MONTHLY", () => {
    const result = computeNextInvoiceDate(new Date("2024-12-15"), "MONTHLY");
    expect(result.getFullYear()).toBe(2025);
    expect(result.getMonth()).toBe(0); // January
  });

  it("should add 3 months for QUARTERLY", () => {
    const result = computeNextInvoiceDate(new Date("2024-01-15"), "QUARTERLY");
    expect(result.getFullYear()).toBe(2024);
    expect(result.getMonth()).toBe(3); // April
    expect(result.getDate()).toBe(15);
  });

  it("should handle year transition for QUARTERLY", () => {
    const result = computeNextInvoiceDate(new Date("2024-11-15"), "QUARTERLY");
    expect(result.getFullYear()).toBe(2025);
    expect(result.getMonth()).toBe(1); // February
  });

  it("should add 1 year for ANNUALLY", () => {
    const result = computeNextInvoiceDate(new Date("2024-03-15"), "ANNUALLY");
    expect(result.getFullYear()).toBe(2025);
    expect(result.getMonth()).toBe(2); // March
    expect(result.getDate()).toBe(15);
  });
});
