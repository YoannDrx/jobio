
-- CreateEnum
CREATE TYPE "public"."BillingClientType" AS ENUM ('COMPANY', 'INDIVIDUAL');

-- CreateEnum
CREATE TYPE "public"."BillingQuoteStatus" AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'REFUSED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."BillingInvoiceStatus" AS ENUM ('DRAFT', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."BillingCreditNoteStatus" AS ENUM ('DRAFT', 'ISSUED', 'APPLIED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."BillingPaymentMethod" AS ENUM ('BANK_TRANSFER', 'CARD', 'CASH', 'CHECK', 'DIRECT_DEBIT', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."BillingPaymentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "public"."BillingSequenceKind" AS ENUM ('QUOTE', 'INVOICE', 'CREDIT_NOTE');

-- CreateEnum
CREATE TYPE "public"."BillingEntityType" AS ENUM ('PROFILE', 'CLIENT', 'QUOTE', 'INVOICE', 'CREDIT_NOTE', 'PAYMENT', 'DECLARATION_PERIOD');

-- CreateEnum
CREATE TYPE "public"."BillingAuditEventType" AS ENUM ('CREATED', 'UPDATED', 'DELETED', 'STATUS_CHANGED', 'NUMBER_ASSIGNED', 'CONVERTED_TO_INVOICE', 'PAYMENT_RECORDED');

-- CreateEnum
CREATE TYPE "public"."BillingDeclarationPeriodType" AS ENUM ('MONTHLY', 'QUARTERLY');

-- CreateEnum
CREATE TYPE "public"."BillingDeclarationPeriodStatus" AS ENUM ('OPEN', 'READY', 'SUBMITTED');


-- CreateTable
CREATE TABLE "public"."billing_profile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "legalName" TEXT NOT NULL,
    "tradeName" TEXT,
    "legalForm" TEXT,
    "siret" TEXT,
    "siren" TEXT,
    "vatNumber" TEXT,
    "rcsNumber" TEXT,
    "rmNumber" TEXT,
    "activityLabel" TEXT,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "postalCode" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL DEFAULT 'FR',
    "email" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "iban" TEXT,
    "bic" TEXT,
    "paymentTermsInDays" INTEGER NOT NULL DEFAULT 30,
    "latePenaltyRate" DOUBLE PRECISION,
    "latePenaltyFlatFeeEur" INTEGER DEFAULT 40,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "billing_profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."billing_client" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "public"."BillingClientType" NOT NULL DEFAULT 'COMPANY',
    "displayName" TEXT NOT NULL,
    "legalName" TEXT,
    "contactFirstName" TEXT,
    "contactLastName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "vatNumber" TEXT,
    "siret" TEXT,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "postalCode" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL DEFAULT 'FR',
    "paymentTermsInDays" INTEGER,
    "defaultLateRate" DOUBLE PRECISION,
    "defaultFlatFeeEur" INTEGER,
    "notes" TEXT,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "billing_client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."billing_catalog_item" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "unitLabel" TEXT NOT NULL DEFAULT 'jour',
    "unitPriceCents" INTEGER NOT NULL,
    "vatRatePercent" DOUBLE PRECISION NOT NULL DEFAULT 20,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "billing_catalog_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."billing_numbering_sequence" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" "public"."BillingSequenceKind" NOT NULL,
    "year" INTEGER NOT NULL,
    "nextCounter" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "billing_numbering_sequence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."billing_quote" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "number" TEXT,
    "status" "public"."BillingQuoteStatus" NOT NULL DEFAULT 'DRAFT',
    "issueDate" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3),
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "notes" TEXT,
    "terms" TEXT,
    "subtotalCents" INTEGER NOT NULL DEFAULT 0,
    "discountCents" INTEGER NOT NULL DEFAULT 0,
    "taxCents" INTEGER NOT NULL DEFAULT 0,
    "totalCents" INTEGER NOT NULL DEFAULT 0,
    "acceptedAt" TIMESTAMP(3),
    "refusedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "billing_quote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."billing_quote_line" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unitPriceCents" INTEGER NOT NULL,
    "discountPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "vatRatePercent" DOUBLE PRECISION NOT NULL DEFAULT 20,
    "subtotalCents" INTEGER NOT NULL,
    "taxCents" INTEGER NOT NULL,
    "totalCents" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "billing_quote_line_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."billing_quote_version" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "reason" TEXT,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "billing_quote_version_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."billing_invoice" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "sourceQuoteId" TEXT,
    "number" TEXT,
    "status" "public"."BillingInvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "issueDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3),
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "notes" TEXT,
    "terms" TEXT,
    "subtotalCents" INTEGER NOT NULL DEFAULT 0,
    "discountCents" INTEGER NOT NULL DEFAULT 0,
    "taxCents" INTEGER NOT NULL DEFAULT 0,
    "totalCents" INTEGER NOT NULL DEFAULT 0,
    "paidCents" INTEGER NOT NULL DEFAULT 0,
    "balanceCents" INTEGER NOT NULL DEFAULT 0,
    "issuedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "billing_invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."billing_invoice_line" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unitPriceCents" INTEGER NOT NULL,
    "discountPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "vatRatePercent" DOUBLE PRECISION NOT NULL DEFAULT 20,
    "subtotalCents" INTEGER NOT NULL,
    "taxCents" INTEGER NOT NULL,
    "totalCents" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "billing_invoice_line_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."billing_invoice_version" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "reason" TEXT,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "billing_invoice_version_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."billing_credit_note" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "number" TEXT,
    "status" "public"."BillingCreditNoteStatus" NOT NULL DEFAULT 'DRAFT',
    "issueDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "subtotalCents" INTEGER NOT NULL DEFAULT 0,
    "taxCents" INTEGER NOT NULL DEFAULT 0,
    "totalCents" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "billing_credit_note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."billing_payment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "method" "public"."BillingPaymentMethod" NOT NULL DEFAULT 'BANK_TRANSFER',
    "status" "public"."BillingPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "reference" TEXT,
    "note" TEXT,
    "amountCents" INTEGER NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "billing_payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."billing_payment_allocation" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "billing_payment_allocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."billing_declaration_period" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "public"."BillingDeclarationPeriodType" NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER,
    "quarter" INTEGER,
    "periodKey" TEXT NOT NULL,
    "status" "public"."BillingDeclarationPeriodStatus" NOT NULL DEFAULT 'OPEN',
    "dueDate" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "invoicedCents" INTEGER NOT NULL DEFAULT 0,
    "collectedCents" INTEGER NOT NULL DEFAULT 0,
    "socialChargesCents" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clientId" TEXT,

    CONSTRAINT "billing_declaration_period_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."billing_social_contribution_snapshot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "periodKey" TEXT NOT NULL,
    "activityType" TEXT NOT NULL,
    "regimeLabel" TEXT NOT NULL,
    "revenueCents" INTEGER NOT NULL,
    "ratePercent" DOUBLE PRECISION NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "billing_social_contribution_snapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."billing_audit_event" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "entityType" "public"."BillingEntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "eventType" "public"."BillingAuditEventType" NOT NULL,
    "message" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "billing_audit_event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "billing_profile_userId_key" ON "public"."billing_profile"("userId");

-- CreateIndex
CREATE INDEX "billing_profile_userId_idx" ON "public"."billing_profile"("userId");

-- CreateIndex
CREATE INDEX "billing_client_userId_deletedAt_idx" ON "public"."billing_client"("userId", "deletedAt");

-- CreateIndex
CREATE INDEX "billing_client_userId_displayName_idx" ON "public"."billing_client"("userId", "displayName");

-- CreateIndex
CREATE INDEX "billing_catalog_item_userId_isActive_idx" ON "public"."billing_catalog_item"("userId", "isActive");

-- CreateIndex
CREATE INDEX "billing_numbering_sequence_userId_kind_idx" ON "public"."billing_numbering_sequence"("userId", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "billing_numbering_sequence_userId_kind_year_key" ON "public"."billing_numbering_sequence"("userId", "kind", "year");

-- CreateIndex
CREATE UNIQUE INDEX "billing_quote_number_key" ON "public"."billing_quote"("number");

-- CreateIndex
CREATE INDEX "billing_quote_userId_status_deletedAt_idx" ON "public"."billing_quote"("userId", "status", "deletedAt");

-- CreateIndex
CREATE INDEX "billing_quote_clientId_createdAt_idx" ON "public"."billing_quote"("clientId", "createdAt");

-- CreateIndex
CREATE INDEX "billing_quote_userId_issueDate_idx" ON "public"."billing_quote"("userId", "issueDate");

-- CreateIndex
CREATE INDEX "billing_quote_line_quoteId_position_idx" ON "public"."billing_quote_line"("quoteId", "position");

-- CreateIndex
CREATE INDEX "billing_quote_version_quoteId_createdAt_idx" ON "public"."billing_quote_version"("quoteId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "billing_quote_version_quoteId_version_key" ON "public"."billing_quote_version"("quoteId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "billing_invoice_number_key" ON "public"."billing_invoice"("number");

-- CreateIndex
CREATE INDEX "billing_invoice_userId_status_deletedAt_idx" ON "public"."billing_invoice"("userId", "status", "deletedAt");

-- CreateIndex
CREATE INDEX "billing_invoice_clientId_createdAt_idx" ON "public"."billing_invoice"("clientId", "createdAt");

-- CreateIndex
CREATE INDEX "billing_invoice_userId_dueDate_idx" ON "public"."billing_invoice"("userId", "dueDate");

-- CreateIndex
CREATE INDEX "billing_invoice_sourceQuoteId_idx" ON "public"."billing_invoice"("sourceQuoteId");

-- CreateIndex
CREATE INDEX "billing_invoice_line_invoiceId_position_idx" ON "public"."billing_invoice_line"("invoiceId", "position");

-- CreateIndex
CREATE INDEX "billing_invoice_version_invoiceId_createdAt_idx" ON "public"."billing_invoice_version"("invoiceId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "billing_invoice_version_invoiceId_version_key" ON "public"."billing_invoice_version"("invoiceId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "billing_credit_note_number_key" ON "public"."billing_credit_note"("number");

-- CreateIndex
CREATE INDEX "billing_credit_note_userId_status_idx" ON "public"."billing_credit_note"("userId", "status");

-- CreateIndex
CREATE INDEX "billing_credit_note_invoiceId_idx" ON "public"."billing_credit_note"("invoiceId");

-- CreateIndex
CREATE INDEX "billing_payment_userId_paidAt_idx" ON "public"."billing_payment"("userId", "paidAt");

-- CreateIndex
CREATE INDEX "billing_payment_clientId_paidAt_idx" ON "public"."billing_payment"("clientId", "paidAt");

-- CreateIndex
CREATE INDEX "billing_payment_allocation_invoiceId_idx" ON "public"."billing_payment_allocation"("invoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "billing_payment_allocation_paymentId_invoiceId_key" ON "public"."billing_payment_allocation"("paymentId", "invoiceId");

-- CreateIndex
CREATE INDEX "billing_declaration_period_userId_status_year_idx" ON "public"."billing_declaration_period"("userId", "status", "year");

-- CreateIndex
CREATE UNIQUE INDEX "billing_declaration_period_userId_periodKey_key" ON "public"."billing_declaration_period"("userId", "periodKey");

-- CreateIndex
CREATE INDEX "billing_social_contribution_snapshot_userId_periodKey_idx" ON "public"."billing_social_contribution_snapshot"("userId", "periodKey");

-- CreateIndex
CREATE INDEX "billing_audit_event_userId_entityType_createdAt_idx" ON "public"."billing_audit_event"("userId", "entityType", "createdAt");

-- CreateIndex
CREATE INDEX "billing_audit_event_entityType_entityId_createdAt_idx" ON "public"."billing_audit_event"("entityType", "entityId", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."billing_profile" ADD CONSTRAINT "billing_profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."billing_client" ADD CONSTRAINT "billing_client_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."billing_catalog_item" ADD CONSTRAINT "billing_catalog_item_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."billing_numbering_sequence" ADD CONSTRAINT "billing_numbering_sequence_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."billing_quote" ADD CONSTRAINT "billing_quote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."billing_quote" ADD CONSTRAINT "billing_quote_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."billing_client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."billing_quote_line" ADD CONSTRAINT "billing_quote_line_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "public"."billing_quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."billing_quote_version" ADD CONSTRAINT "billing_quote_version_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "public"."billing_quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."billing_quote_version" ADD CONSTRAINT "billing_quote_version_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."billing_invoice" ADD CONSTRAINT "billing_invoice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."billing_invoice" ADD CONSTRAINT "billing_invoice_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."billing_client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."billing_invoice" ADD CONSTRAINT "billing_invoice_sourceQuoteId_fkey" FOREIGN KEY ("sourceQuoteId") REFERENCES "public"."billing_quote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."billing_invoice_line" ADD CONSTRAINT "billing_invoice_line_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "public"."billing_invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."billing_invoice_version" ADD CONSTRAINT "billing_invoice_version_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "public"."billing_invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."billing_invoice_version" ADD CONSTRAINT "billing_invoice_version_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."billing_credit_note" ADD CONSTRAINT "billing_credit_note_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."billing_credit_note" ADD CONSTRAINT "billing_credit_note_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "public"."billing_invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."billing_payment" ADD CONSTRAINT "billing_payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."billing_payment" ADD CONSTRAINT "billing_payment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."billing_client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."billing_payment_allocation" ADD CONSTRAINT "billing_payment_allocation_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "public"."billing_payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."billing_payment_allocation" ADD CONSTRAINT "billing_payment_allocation_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "public"."billing_invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."billing_declaration_period" ADD CONSTRAINT "billing_declaration_period_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."billing_declaration_period" ADD CONSTRAINT "billing_declaration_period_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."billing_client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."billing_social_contribution_snapshot" ADD CONSTRAINT "billing_social_contribution_snapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."billing_audit_event" ADD CONSTRAINT "billing_audit_event_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
