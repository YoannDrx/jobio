ALTER TABLE "billing_profile"
ADD COLUMN "documentTemplate" TEXT NOT NULL DEFAULT 'jobio-octamy';

ALTER TABLE "billing_invoice"
ADD COLUMN "documentTemplate" TEXT;
