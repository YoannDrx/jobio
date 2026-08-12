import {
  isChargeFullyRefunded,
  resolveProgramPurchaseStatus,
} from "@/lib/stripe/program-purchase-state";
import { describe, expect, it } from "vitest";

describe("program purchase state", () => {
  it("keeps a delayed payment pending until Stripe confirms it", () => {
    expect(
      resolveProgramPurchaseStatus({
        eventType: "checkout.session.completed",
        paymentStatus: "unpaid",
      }),
    ).toBe("pending");
    expect(
      resolveProgramPurchaseStatus({
        eventType: "checkout.session.async_payment_succeeded",
        paymentStatus: "paid",
      }),
    ).toBe("completed");
  });

  it("marks failed and expired delayed payments as failed", () => {
    expect(
      resolveProgramPurchaseStatus({
        eventType: "checkout.session.async_payment_failed",
        paymentStatus: "unpaid",
      }),
    ).toBe("failed");
    expect(
      resolveProgramPurchaseStatus({
        eventType: "checkout.session.expired",
        paymentStatus: "unpaid",
      }),
    ).toBe("failed");
  });

  it("revokes lifetime access only after a full refund", () => {
    expect(
      isChargeFullyRefunded({
        amount: 3900,
        amountRefunded: 1000,
        refunded: false,
      }),
    ).toBe(false);
    expect(
      isChargeFullyRefunded({
        amount: 3900,
        amountRefunded: 3900,
        refunded: true,
      }),
    ).toBe(true);
  });
});
