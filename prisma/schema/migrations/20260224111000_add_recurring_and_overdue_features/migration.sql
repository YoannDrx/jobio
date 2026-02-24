-- CreateEnum
CREATE TYPE "public"."BillingRecurrenceFrequency" AS ENUM ('MONTHLY', 'QUARTERLY', 'ANNUALLY');

-- AlterEnum
ALTER TYPE "public"."AIFeature" ADD VALUE 'CV_TRANSLATE';

-- AlterEnum
ALTER TYPE "public"."BillingEntityType" ADD VALUE 'RECURRING_INVOICE';

-- AlterEnum
ALTER TYPE "public"."NotificationType" ADD VALUE 'BILLING_INVOICE_OVERDUE';

-- AlterTable
ALTER TABLE "public"."user_preference" ADD COLUMN     "notifyOverdueInvoices" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "pushOverdueInvoices" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "public"."billing_recurring_invoice" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "frequency" "public"."BillingRecurrenceFrequency" NOT NULL,
    "lines" JSONB NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "notes" TEXT,
    "terms" TEXT,
    "documentTemplate" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "nextInvoiceDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastGeneratedAt" TIMESTAMP(3),
    "generatedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "billing_recurring_invoice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "billing_recurring_invoice_userId_isActive_idx" ON "public"."billing_recurring_invoice"("userId", "isActive");

-- CreateIndex
CREATE INDEX "billing_recurring_invoice_isActive_nextInvoiceDate_idx" ON "public"."billing_recurring_invoice"("isActive", "nextInvoiceDate");

-- AddForeignKey
ALTER TABLE "public"."billing_recurring_invoice" ADD CONSTRAINT "billing_recurring_invoice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."billing_recurring_invoice" ADD CONSTRAINT "billing_recurring_invoice_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."billing_client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
