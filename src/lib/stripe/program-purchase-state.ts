export type ProgramPurchaseStatus = "pending" | "completed" | "failed";

type ProgramCheckoutEventType =
  | "checkout.session.completed"
  | "checkout.session.async_payment_succeeded"
  | "checkout.session.async_payment_failed"
  | "checkout.session.expired";

export const resolveProgramPurchaseStatus = (params: {
  eventType: ProgramCheckoutEventType;
  paymentStatus: string;
}): ProgramPurchaseStatus => {
  if (params.eventType === "checkout.session.async_payment_succeeded") {
    return "completed";
  }
  if (
    params.eventType === "checkout.session.async_payment_failed" ||
    params.eventType === "checkout.session.expired"
  ) {
    return "failed";
  }
  return params.paymentStatus === "paid" ? "completed" : "pending";
};

export const isChargeFullyRefunded = (charge: {
  amount: number;
  amountRefunded: number;
  refunded: boolean;
}) => charge.refunded === true && charge.amountRefunded >= charge.amount;
