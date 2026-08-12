ALTER TABLE "user_preference"
ADD COLUMN "proTrialStartedAt" TIMESTAMP(3),
ADD COLUMN "proTrialEndsAt" TIMESTAMP(3),
ADD COLUMN "proTrialConsumedAt" TIMESTAMP(3);

CREATE TABLE "pro_trial_identity" (
  "id" TEXT NOT NULL,
  "emailFingerprint" TEXT NOT NULL,
  "firstUserId" TEXT NOT NULL,
  "stripeCustomerId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "consumedAt" TIMESTAMP(3),
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "pro_trial_identity_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "pro_trial_identity_emailFingerprint_key"
ON "pro_trial_identity"("emailFingerprint");
CREATE UNIQUE INDEX "pro_trial_identity_stripeCustomerId_key"
ON "pro_trial_identity"("stripeCustomerId");
CREATE INDEX "pro_trial_identity_firstUserId_idx"
ON "pro_trial_identity"("firstUserId");

ALTER TABLE "stripe_webhook_event"
ADD COLUMN "status" TEXT NOT NULL DEFAULT 'PROCESSED',
ADD COLUMN "attempts" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "objectId" TEXT,
ADD COLUMN "businessObjectId" TEXT,
ADD COLUMN "payload" JSONB,
ADD COLUMN "lastError" TEXT,
ADD COLUMN "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "failedAt" TIMESTAMP(3),
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "stripe_webhook_event"
ALTER COLUMN "processedAt" DROP DEFAULT,
ALTER COLUMN "processedAt" DROP NOT NULL;

CREATE INDEX "stripe_webhook_event_status_receivedAt_idx"
ON "stripe_webhook_event"("status", "receivedAt");

ALTER TABLE "stripe_webhook_event"
ALTER COLUMN "status" SET DEFAULT 'PROCESSING';

INSERT INTO "plan_entitlement"
  ("id", "plan", "version", "featureKey", "value", "isActive", "createdAt", "updatedAt")
VALUES
  ('pe_free_missions_v2', 'free', 2, 'missions', 15, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pe_free_profiles_v2', 'free', 2, 'profiles', 2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pe_free_contacts_v2', 'free', 2, 'contacts', 30, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pe_free_platforms_v2', 'free', 2, 'platforms', 3, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pe_free_companies_v2', 'free', 2, 'companies', 10, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pe_free_billingclients_v2', 'free', 2, 'billingClients', 3, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pe_free_billingquotes_v2', 'free', 2, 'billingQuotes', 5, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pe_free_billinginvoices_v2', 'free', 2, 'billingInvoices', 5, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pe_free_billingcatalog_v2', 'free', 2, 'billingCatalogItems', 5, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pe_free_billingrecurring_v2', 'free', 2, 'billingRecurringInvoices', 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pe_free_airequests_v2', 'free', 2, 'aiRequestsPerMonth', 5, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pe_free_analyticshistory_v2', 'free', 2, 'analyticsHistoryDays', 30, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pe_free_cvdocuments_v2', 'free', 2, 'cvDocuments', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pe_free_cvtemplatesall_v2', 'free', 2, 'cvTemplatesAll', 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pe_free_cvcoachai_v2', 'free', 2, 'cvCoachAI', 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pe_free_atsscoring_v2', 'free', 2, 'atsScoring', 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pe_free_autofollowups_v2', 'free', 2, 'autoFollowUps', 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pe_free_sequences_v2', 'free', 2, 'sequences', 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pe_free_messagetemplates_v2', 'free', 2, 'messageTemplates', 3, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pe_free_csvexport_v2', 'free', 2, 'csvExport', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pe_free_aiemailgen_v2', 'free', 2, 'aiEmailGeneration', 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pe_free_ailinkedinaudit_v2', 'free', 2, 'aiLinkedinAudit', 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pe_pro_missions_v2', 'pro', 2, 'missions', 999999, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pe_pro_profiles_v2', 'pro', 2, 'profiles', 10, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pe_pro_contacts_v2', 'pro', 2, 'contacts', 1000, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pe_pro_platforms_v2', 'pro', 2, 'platforms', 999999, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pe_pro_companies_v2', 'pro', 2, 'companies', 500, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pe_pro_billingclients_v2', 'pro', 2, 'billingClients', 999999, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pe_pro_billingquotes_v2', 'pro', 2, 'billingQuotes', 999999, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pe_pro_billinginvoices_v2', 'pro', 2, 'billingInvoices', 999999, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pe_pro_billingcatalog_v2', 'pro', 2, 'billingCatalogItems', 999999, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pe_pro_billingrecurring_v2', 'pro', 2, 'billingRecurringInvoices', 50, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pe_pro_airequests_v2', 'pro', 2, 'aiRequestsPerMonth', 100, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pe_pro_analyticshistory_v2', 'pro', 2, 'analyticsHistoryDays', 999999, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pe_pro_cvdocuments_v2', 'pro', 2, 'cvDocuments', 20, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pe_pro_cvtemplatesall_v2', 'pro', 2, 'cvTemplatesAll', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pe_pro_cvcoachai_v2', 'pro', 2, 'cvCoachAI', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pe_pro_atsscoring_v2', 'pro', 2, 'atsScoring', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pe_pro_autofollowups_v2', 'pro', 2, 'autoFollowUps', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pe_pro_sequences_v2', 'pro', 2, 'sequences', 20, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pe_pro_messagetemplates_v2', 'pro', 2, 'messageTemplates', 100, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pe_pro_csvexport_v2', 'pro', 2, 'csvExport', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pe_pro_aiemailgen_v2', 'pro', 2, 'aiEmailGeneration', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pe_pro_ailinkedinaudit_v2', 'pro', 2, 'aiLinkedinAudit', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("plan", "version", "featureKey") DO UPDATE
SET "value" = EXCLUDED."value",
    "isActive" = true,
    "updatedAt" = CURRENT_TIMESTAMP;

UPDATE "plan_entitlement_release"
SET "activeVersion" = 2, "updatedAt" = CURRENT_TIMESTAMP
WHERE "plan" IN ('free', 'pro');

-- Ultra is closed to new subscriptions in application code, but existing
-- production subscribers keep their historical entitlement release.
