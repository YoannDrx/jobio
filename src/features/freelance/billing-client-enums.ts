/**
 * Client-safe mirrors of the billing enum values persisted by Prisma.
 *
 * Importing Prisma's generated runtime from a Client Component causes Next.js
 * to trace the database engine and the whole project into the browser SSR
 * bundle. These constants intentionally contain values only; server-side
 * validation remains backed by the Prisma enums.
 */
export const BillingClientType = {
  COMPANY: "COMPANY",
  INDIVIDUAL: "INDIVIDUAL",
} as const;
export type BillingClientType =
  (typeof BillingClientType)[keyof typeof BillingClientType];

export const BillingQuoteStatus = {
  DRAFT: "DRAFT",
  SENT: "SENT",
  ACCEPTED: "ACCEPTED",
  REFUSED: "REFUSED",
  EXPIRED: "EXPIRED",
  CANCELLED: "CANCELLED",
} as const;
export type BillingQuoteStatus =
  (typeof BillingQuoteStatus)[keyof typeof BillingQuoteStatus];

export const BillingInvoiceStatus = {
  DRAFT: "DRAFT",
  ISSUED: "ISSUED",
  PARTIALLY_PAID: "PARTIALLY_PAID",
  PAID: "PAID",
  OVERDUE: "OVERDUE",
  CANCELLED: "CANCELLED",
} as const;
export type BillingInvoiceStatus =
  (typeof BillingInvoiceStatus)[keyof typeof BillingInvoiceStatus];

export const BillingPaymentMethod = {
  BANK_TRANSFER: "BANK_TRANSFER",
  CARD: "CARD",
  CASH: "CASH",
  CHECK: "CHECK",
  DIRECT_DEBIT: "DIRECT_DEBIT",
  OTHER: "OTHER",
} as const;
export type BillingPaymentMethod =
  (typeof BillingPaymentMethod)[keyof typeof BillingPaymentMethod];

export const BillingDeclarationPeriodType = {
  MONTHLY: "MONTHLY",
  QUARTERLY: "QUARTERLY",
} as const;
export type BillingDeclarationPeriodType =
  (typeof BillingDeclarationPeriodType)[keyof typeof BillingDeclarationPeriodType];

export const BillingExpenseStatus = {
  DRAFT: "DRAFT",
  SUBMITTED: "SUBMITTED",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  ARCHIVED: "ARCHIVED",
} as const;
export type BillingExpenseStatus =
  (typeof BillingExpenseStatus)[keyof typeof BillingExpenseStatus];
