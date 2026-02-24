import type { BillingRecurrenceFrequency } from "@/generated/prisma";

export const computeNextInvoiceDate = (
  currentDate: Date,
  frequency: BillingRecurrenceFrequency,
): Date => {
  const next = new Date(currentDate);
  const originalDay = next.getDate();

  switch (frequency) {
    case "MONTHLY":
      next.setMonth(next.getMonth() + 1);
      break;
    case "QUARTERLY":
      next.setMonth(next.getMonth() + 3);
      break;
    case "ANNUALLY":
      next.setFullYear(next.getFullYear() + 1);
      break;
  }

  // Clamp to last day of target month if overflow occurred
  if (next.getDate() !== originalDay) {
    next.setDate(0); // Go to last day of previous month
  }

  return next;
};
