ALTER TABLE "public"."billing_profile"
ADD COLUMN "documentPrimaryColor" TEXT,
ADD COLUMN "documentAccentColor" TEXT,
ADD COLUMN "documentLogoUrl" TEXT,
ADD COLUMN "documentFooterText" TEXT,
ADD COLUMN "documentShowNotes" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "documentShowTerms" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "documentShowBankDetails" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "documentShowClientContact" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "documentShowIssuerContact" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "documentShowLineVat" BOOLEAN NOT NULL DEFAULT true;
