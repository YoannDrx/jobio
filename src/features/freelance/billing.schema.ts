import {
  BillingDeclarationPeriodType,
  BillingClientType,
  BillingInvoiceStatus,
  BillingPaymentMethod,
  BillingQuoteStatus,
} from "@/generated/prisma";
import {
  ACTIVITY_CATEGORY_VALUES,
  FREELANCE_STATUS_VALUES,
} from "@/features/freelance/billing-compliance-rules";
import { BILLING_DOCUMENT_TEMPLATE_IDS } from "@/features/freelance/billing-document-templates";
import { z } from "zod";

const optionalEmailSchema = z.string().email().optional().or(z.literal(""));

const optionalUrlSchema = z.string().url().optional().or(z.literal(""));
const optionalHexColorSchema = z
  .string()
  .regex(/^#([0-9a-fA-F]{6})$/, "Format attendu: #RRGGBB")
  .optional()
  .or(z.literal(""));

export const billingClientContactSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  role: z.string().optional(),
  email: optionalEmailSchema,
  phone: z.string().optional(),
  includeInEmail: z.boolean().default(false),
  isPrimary: z.boolean().default(false),
  notes: z.string().optional(),
});

export const billingClientFilterSchema = z.object({
  search: z.string().optional(),
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(20),
  sortBy: z.enum(["createdAt", "displayName"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const createBillingClientSchema = z.object({
  type: z.nativeEnum(BillingClientType).default(BillingClientType.COMPANY),
  displayName: z.string().min(1, "Le nom client est requis"),
  legalName: z.string().optional(),
  contactFirstName: z.string().optional(),
  contactLastName: z.string().optional(),
  email: optionalEmailSchema,
  phone: z.string().optional(),
  vatNumber: z.string().optional(),
  siret: z.string().optional(),
  addressLine1: z.string().min(1, "L’adresse est requise"),
  addressLine2: z.string().optional(),
  postalCode: z.string().min(1, "Le code postal est requis"),
  city: z.string().min(1, "La ville est requise"),
  countryCode: z.string().length(2).default("FR"),
  paymentTermsInDays: z.number().int().min(0).max(365).optional(),
  defaultLateRate: z.number().min(0).max(100).optional(),
  defaultFlatFeeEur: z.number().int().min(0).max(5000).optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).default([]),
  contacts: z.array(billingClientContactSchema).max(20).default([]),
});

export const updateBillingClientSchema = createBillingClientSchema
  .partial()
  .extend({
    id: z.string(),
  });

export const upsertBillingProfileSchema = z.object({
  legalName: z.string().min(1, "Le nom légal est requis"),
  tradeName: z.string().optional(),
  legalForm: z.string().optional(),
  siret: z.string().optional(),
  siren: z.string().optional(),
  vatNumber: z.string().optional(),
  rcsNumber: z.string().optional(),
  rmNumber: z.string().optional(),
  activityLabel: z.string().optional(),
  addressLine1: z.string().min(1),
  addressLine2: z.string().optional(),
  postalCode: z.string().min(1),
  city: z.string().min(1),
  countryCode: z.string().length(2).default("FR"),
  email: optionalEmailSchema,
  phone: z.string().optional(),
  website: optionalUrlSchema,
  iban: z.string().optional(),
  bic: z.string().optional(),
  paymentTermsInDays: z.number().int().min(0).max(365).default(30),
  latePenaltyRate: z.number().min(0).max(100).optional(),
  latePenaltyFlatFeeEur: z.number().int().min(0).max(5000).default(40),
  notes: z.string().optional(),
  freelanceStatus: z.enum(FREELANCE_STATUS_VALUES).optional(),
  activityCategory: z.enum(ACTIVITY_CATEGORY_VALUES).optional(),
  urssafDeclarationType: z.nativeEnum(BillingDeclarationPeriodType).optional(),
  urssafContributionRate: z.number().min(0).max(100).optional(),
  vatExemptionMention: z.string().optional(),
  documentTemplate: z.enum(BILLING_DOCUMENT_TEMPLATE_IDS).optional(),
  documentPrimaryColor: optionalHexColorSchema,
  documentAccentColor: optionalHexColorSchema,
  documentLogoUrl: optionalUrlSchema,
  documentFooterText: z.string().optional(),
  documentShowNotes: z.boolean().default(true),
  documentShowTerms: z.boolean().default(true),
  documentShowBankDetails: z.boolean().default(true),
  documentShowClientContact: z.boolean().default(true),
  documentShowIssuerContact: z.boolean().default(true),
  documentShowLineVat: z.boolean().default(true),
});

export const billingLineSchema = z.object({
  description: z.string().min(1, "La description est requise"),
  quantity: z.number().positive().default(1),
  unitPriceCents: z.number().int().min(0),
  discountPercent: z.number().min(0).max(100).default(0),
  vatRatePercent: z.number().min(0).max(100).default(20),
});

export const quoteFilterSchema = z.object({
  search: z.string().optional(),
  status: z.nativeEnum(BillingQuoteStatus).optional(),
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(20),
});

export const createQuoteDraftSchema = z.object({
  clientId: z.string(),
  issueDate: z.coerce.date(),
  validUntil: z.coerce.date().optional(),
  currency: z.string().length(3).default("EUR"),
  notes: z.string().optional(),
  terms: z.string().optional(),
  lines: z.array(billingLineSchema).min(1),
});

export const updateQuoteDraftSchema = createQuoteDraftSchema.partial().extend({
  quoteId: z.string(),
  validUntil: z.coerce.date().nullable().optional(),
});

export const setQuoteStatusSchema = z.object({
  quoteId: z.string(),
  status: z.nativeEnum(BillingQuoteStatus),
});

export const duplicateQuoteSchema = z.object({
  quoteId: z.string(),
});

export const deleteQuoteSchema = z.object({
  quoteId: z.string(),
});

const bulkActionContextSchema = z.object({
  ids: z.array(z.string()).min(1).max(100),
  reason: z
    .string()
    .trim()
    .min(3, "Un motif est requis")
    .max(300, "Le motif est trop long"),
  dryRun: z.boolean().default(false),
});

export const bulkQuoteActionSchema = bulkActionContextSchema.extend({
  operation: z.enum(["SEND", "CANCEL", "DELETE"]),
});

export const restoreQuoteSchema = z.object({
  quoteId: z.string(),
});

export const convertQuoteToInvoiceSchema = z.object({
  quoteId: z.string(),
  issueDate: z.coerce.date().optional(),
  dueDate: z.coerce.date().optional(),
  notes: z.string().optional(),
  terms: z.string().optional(),
});

export const invoiceFilterSchema = z.object({
  search: z.string().optional(),
  status: z.nativeEnum(BillingInvoiceStatus).optional(),
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(20),
});

export const createInvoiceDraftSchema = z.object({
  clientId: z.string(),
  issueDate: z.coerce.date(),
  dueDate: z.coerce.date().optional(),
  currency: z.string().length(3).default("EUR"),
  documentTemplate: z.enum(BILLING_DOCUMENT_TEMPLATE_IDS).optional(),
  notes: z.string().optional(),
  terms: z.string().optional(),
  lines: z.array(billingLineSchema).min(1),
});

export const updateInvoiceDraftSchema = createInvoiceDraftSchema
  .partial()
  .extend({
    invoiceId: z.string(),
    dueDate: z.coerce.date().nullable().optional(),
  });

export const issueInvoiceSchema = z.object({
  invoiceId: z.string(),
  issueDate: z.coerce.date().optional(),
});

export const duplicateInvoiceSchema = z.object({
  invoiceId: z.string(),
});

export const cancelInvoiceSchema = z.object({
  invoiceId: z.string(),
});

export const deleteInvoiceSchema = z.object({
  invoiceId: z.string(),
});

export const bulkInvoiceActionSchema = bulkActionContextSchema.extend({
  operation: z.enum(["ISSUE", "CANCEL", "DELETE"]),
});

export const restoreInvoiceSchema = z.object({
  invoiceId: z.string(),
});

export const recordInvoicePaymentSchema = z.object({
  invoiceId: z.string(),
  amountCents: z.number().int().positive(),
  paidAt: z.coerce.date(),
  method: z.nativeEnum(BillingPaymentMethod),
  reference: z.string().optional(),
  note: z.string().optional(),
});

export const creditNoteFilterSchema = z.object({
  search: z.string().optional(),
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(20),
});

export const createCreditNoteSchema = z.object({
  invoiceId: z.string(),
  amountCents: z.number().int().positive().optional(),
  reason: z.string().optional(),
  issueDate: z.coerce.date().optional(),
});

export const catalogFilterSchema = z.object({
  search: z.string().optional(),
  includeInactive: z.boolean().default(false),
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(50),
});

export const createCatalogItemSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  unitLabel: z.string().min(1).default("jour"),
  unitPriceCents: z.number().int().min(0),
  vatRatePercent: z.number().min(0).max(100).default(20),
});

export const updateCatalogItemSchema = createCatalogItemSchema
  .partial()
  .extend({
    id: z.string(),
    isActive: z.boolean().optional(),
  });

export const rebuildDeclarationPeriodsSchema = z.object({
  year: z.number().int().min(2020).max(2100),
  type: z.nativeEnum(BillingDeclarationPeriodType).optional(),
  contributionRatePercent: z.number().min(0).max(100).optional(),
});

export const createRecurringInvoiceSchema = z.object({
  clientId: z.string(),
  name: z.string().min(1, "Le nom est requis"),
  frequency: z.enum(["MONTHLY", "QUARTERLY", "ANNUALLY"]),
  lines: z.array(billingLineSchema).min(1),
  currency: z.string().length(3).default("EUR"),
  notes: z.string().optional(),
  terms: z.string().optional(),
  documentTemplate: z.enum(BILLING_DOCUMENT_TEMPLATE_IDS).optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().nullable().optional(),
});

export const updateRecurringInvoiceSchema = createRecurringInvoiceSchema
  .partial()
  .extend({
    id: z.string(),
    isActive: z.boolean().optional(),
  });

export const deleteRecurringInvoiceSchema = z.object({
  id: z.string(),
});

export const listRecurringInvoicesSchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(20),
});

export type BillingLineInput = z.infer<typeof billingLineSchema>;
