import {
  computeDocumentLines,
  computeDocumentTotals,
  computeLineAmounts,
} from "@/features/freelance/billing-math";
import { describe, expect, it } from "vitest";

describe("billing-math", () => {
  it("computes line amounts in cents", () => {
    const line = computeLineAmounts({
      description: "Mission produit",
      quantity: 2,
      unitPriceCents: 35000,
      discountPercent: 10,
      vatRatePercent: 20,
    });

    expect(line.grossCents).toBe(70000);
    expect(line.discountCents).toBe(7000);
    expect(line.subtotalCents).toBe(63000);
    expect(line.taxCents).toBe(12600);
    expect(line.totalCents).toBe(75600);
  });

  it("computes document totals from multiple lines", () => {
    const lines = computeDocumentLines([
      {
        description: "Jour de consulting",
        quantity: 3,
        unitPriceCents: 50000,
        discountPercent: 0,
        vatRatePercent: 20,
      },
      {
        description: "Atelier stratégique",
        quantity: 1,
        unitPriceCents: 25000,
        discountPercent: 20,
        vatRatePercent: 20,
      },
    ]);

    const totals = computeDocumentTotals(lines);

    expect(totals.subtotalCents).toBe(170000);
    expect(totals.taxCents).toBe(34000);
    expect(totals.totalCents).toBe(204000);
    expect(totals.discountCents).toBe(5000);
  });

  it("clamps invalid percentages", () => {
    const line = computeLineAmounts({
      description: "Audit",
      quantity: 1,
      unitPriceCents: 10000,
      discountPercent: 400,
      vatRatePercent: -10,
    });

    expect(line.discountPercent).toBe(100);
    expect(line.vatRatePercent).toBe(0);
    expect(line.totalCents).toBe(0);
  });
});
