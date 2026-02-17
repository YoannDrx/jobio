DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'BillingExpenseStatus'
  ) THEN
    CREATE TYPE "public"."BillingExpenseStatus" AS ENUM (
      'DRAFT',
      'SUBMITTED',
      'APPROVED',
      'REJECTED',
      'ARCHIVED'
    );
  END IF;
END $$;

DO $$
BEGIN
  ALTER TYPE "public"."BillingEntityType" ADD VALUE IF NOT EXISTS 'EXPENSE_INVOICE';
  ALTER TYPE "public"."BillingEntityType" ADD VALUE IF NOT EXISTS 'EXPENSE_NOTE';
  ALTER TYPE "public"."BillingEntityType" ADD VALUE IF NOT EXISTS 'EXPENSE_TRIP';
END $$;

CREATE TABLE IF NOT EXISTS "billing_client_contact" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "position" INTEGER NOT NULL DEFAULT 0,
  "lastName" TEXT,
  "firstName" TEXT,
  "role" TEXT,
  "email" TEXT,
  "phone" TEXT,
  "includeInEmail" BOOLEAN NOT NULL DEFAULT false,
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "billing_client_contact_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "billing_expense_invoice" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "vendorName" TEXT NOT NULL,
  "vendorVatNumber" TEXT,
  "documentNumber" TEXT,
  "issueDate" TIMESTAMP(3) NOT NULL,
  "dueDate" TIMESTAMP(3),
  "currency" TEXT NOT NULL DEFAULT 'EUR',
  "category" TEXT,
  "status" "public"."BillingExpenseStatus" NOT NULL DEFAULT 'DRAFT',
  "totalExclTaxCents" INTEGER NOT NULL DEFAULT 0,
  "taxCents" INTEGER NOT NULL DEFAULT 0,
  "totalInclTaxCents" INTEGER NOT NULL DEFAULT 0,
  "deductibleTaxCents" INTEGER NOT NULL DEFAULT 0,
  "isPaid" BOOLEAN NOT NULL DEFAULT false,
  "paidAt" TIMESTAMP(3),
  "paymentReference" TEXT,
  "matchedRegisterRef" TEXT,
  "attachmentUrl" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "billing_expense_invoice_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "billing_expense_note" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "category" TEXT,
  "expenseDate" TIMESTAMP(3) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'EUR',
  "status" "public"."BillingExpenseStatus" NOT NULL DEFAULT 'DRAFT',
  "amountExclTaxCents" INTEGER NOT NULL DEFAULT 0,
  "taxCents" INTEGER NOT NULL DEFAULT 0,
  "amountInclTaxCents" INTEGER NOT NULL DEFAULT 0,
  "deductibleTaxCents" INTEGER NOT NULL DEFAULT 0,
  "isReimbursable" BOOLEAN NOT NULL DEFAULT true,
  "isPaid" BOOLEAN NOT NULL DEFAULT false,
  "paidAt" TIMESTAMP(3),
  "paymentReference" TEXT,
  "matchedRegisterRef" TEXT,
  "attachmentUrl" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "billing_expense_note_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "billing_expense_trip" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "tripDate" TIMESTAMP(3) NOT NULL,
  "fromAddress" TEXT NOT NULL,
  "toAddress" TEXT NOT NULL,
  "distanceKm" DOUBLE PRECISION NOT NULL,
  "roundTrip" BOOLEAN NOT NULL DEFAULT false,
  "vehiclePower" TEXT,
  "allowanceRateCentsPerKm" INTEGER NOT NULL DEFAULT 0,
  "tollCents" INTEGER NOT NULL DEFAULT 0,
  "parkingCents" INTEGER NOT NULL DEFAULT 0,
  "totalCents" INTEGER NOT NULL DEFAULT 0,
  "status" "public"."BillingExpenseStatus" NOT NULL DEFAULT 'DRAFT',
  "isPaid" BOOLEAN NOT NULL DEFAULT false,
  "paidAt" TIMESTAMP(3),
  "paymentReference" TEXT,
  "matchedRegisterRef" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "billing_expense_trip_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'billing_client_contact_userId_fkey'
  ) THEN
    ALTER TABLE "billing_client_contact"
    ADD CONSTRAINT "billing_client_contact_userId_fkey"
    FOREIGN KEY ("userId")
    REFERENCES "user"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'billing_client_contact_clientId_fkey'
  ) THEN
    ALTER TABLE "billing_client_contact"
    ADD CONSTRAINT "billing_client_contact_clientId_fkey"
    FOREIGN KEY ("clientId")
    REFERENCES "billing_client"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'billing_expense_invoice_userId_fkey'
  ) THEN
    ALTER TABLE "billing_expense_invoice"
    ADD CONSTRAINT "billing_expense_invoice_userId_fkey"
    FOREIGN KEY ("userId")
    REFERENCES "user"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'billing_expense_note_userId_fkey'
  ) THEN
    ALTER TABLE "billing_expense_note"
    ADD CONSTRAINT "billing_expense_note_userId_fkey"
    FOREIGN KEY ("userId")
    REFERENCES "user"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'billing_expense_trip_userId_fkey'
  ) THEN
    ALTER TABLE "billing_expense_trip"
    ADD CONSTRAINT "billing_expense_trip_userId_fkey"
    FOREIGN KEY ("userId")
    REFERENCES "user"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "billing_client_contact_userId_clientId_idx"
ON "billing_client_contact"("userId", "clientId");

CREATE INDEX IF NOT EXISTS "billing_client_contact_clientId_position_idx"
ON "billing_client_contact"("clientId", "position");

CREATE INDEX IF NOT EXISTS "billing_expense_invoice_userId_status_deletedAt_idx"
ON "billing_expense_invoice"("userId", "status", "deletedAt");

CREATE INDEX IF NOT EXISTS "billing_expense_invoice_userId_issueDate_idx"
ON "billing_expense_invoice"("userId", "issueDate");

CREATE INDEX IF NOT EXISTS "billing_expense_note_userId_status_deletedAt_idx"
ON "billing_expense_note"("userId", "status", "deletedAt");

CREATE INDEX IF NOT EXISTS "billing_expense_note_userId_expenseDate_idx"
ON "billing_expense_note"("userId", "expenseDate");

CREATE INDEX IF NOT EXISTS "billing_expense_trip_userId_status_deletedAt_idx"
ON "billing_expense_trip"("userId", "status", "deletedAt");

CREATE INDEX IF NOT EXISTS "billing_expense_trip_userId_tripDate_idx"
ON "billing_expense_trip"("userId", "tripDate");
