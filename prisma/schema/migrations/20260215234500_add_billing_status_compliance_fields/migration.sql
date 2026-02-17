ALTER TABLE "public"."billing_profile"
ADD COLUMN "freelanceStatus" TEXT,
ADD COLUMN "activityCategory" TEXT,
ADD COLUMN "urssafDeclarationType" "public"."BillingDeclarationPeriodType",
ADD COLUMN "urssafContributionRate" DOUBLE PRECISION,
ADD COLUMN "vatExemptionMention" TEXT;
