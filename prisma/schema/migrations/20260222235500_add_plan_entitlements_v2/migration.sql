-- CreateTable
CREATE TABLE "plan_entitlement_release" (
    "id" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "activeVersion" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plan_entitlement_release_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_entitlement" (
    "id" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "featureKey" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plan_entitlement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "plan_entitlement_release_plan_key" ON "plan_entitlement_release"("plan");

-- CreateIndex
CREATE INDEX "plan_entitlement_release_activeVersion_idx" ON "plan_entitlement_release"("activeVersion");

-- CreateIndex
CREATE UNIQUE INDEX "plan_entitlement_plan_version_featureKey_key" ON "plan_entitlement"("plan", "version", "featureKey");

-- CreateIndex
CREATE INDEX "plan_entitlement_plan_version_isActive_idx" ON "plan_entitlement"("plan", "version", "isActive");

-- CreateIndex
CREATE INDEX "plan_entitlement_featureKey_idx" ON "plan_entitlement"("featureKey");

-- Seed active release by plan
INSERT INTO "plan_entitlement_release" ("id", "plan", "activeVersion", "createdAt", "updatedAt") VALUES
  ('per_free_v1', 'free', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('per_pro_v1', 'pro', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('per_ultra_v1', 'ultra', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Seed entitlements version 1 (aligned with src/lib/auth/stripe/auth-plans.ts)
INSERT INTO "plan_entitlement"
  ("id", "plan", "version", "featureKey", "value", "isActive", "createdAt", "updatedAt")
VALUES
  ('pe_free_missions_v1', 'free', 1, 'missions', 15, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pe_free_profiles_v1', 'free', 1, 'profiles', 2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pe_free_contacts_v1', 'free', 1, 'contacts', 30, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pe_free_platforms_v1', 'free', 1, 'platforms', 3, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pe_free_companies_v1', 'free', 1, 'companies', 10, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pe_free_billingclients_v1', 'free', 1, 'billingClients', 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pe_free_billingquotes_v1', 'free', 1, 'billingQuotes', 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pe_free_billinginvoices_v1', 'free', 1, 'billingInvoices', 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pe_free_billingcatalog_v1', 'free', 1, 'billingCatalogItems', 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pe_free_airequests_v1', 'free', 1, 'aiRequestsPerMonth', 5, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pe_free_analyticshistory_v1', 'free', 1, 'analyticsHistoryDays', 7, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pe_free_cvdocuments_v1', 'free', 1, 'cvDocuments', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pe_free_cvtemplatesall_v1', 'free', 1, 'cvTemplatesAll', 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pe_free_cvcoachai_v1', 'free', 1, 'cvCoachAI', 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pe_free_atsscoring_v1', 'free', 1, 'atsScoring', 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pe_free_autofollowups_v1', 'free', 1, 'autoFollowUps', 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pe_free_sequences_v1', 'free', 1, 'sequences', 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pe_free_messagetemplates_v1', 'free', 1, 'messageTemplates', 3, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pe_free_csvexport_v1', 'free', 1, 'csvExport', 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pe_free_aiemailgen_v1', 'free', 1, 'aiEmailGeneration', 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pe_free_ailinkedinaudit_v1', 'free', 1, 'aiLinkedinAudit', 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

  ('pe_pro_missions_v1', 'pro', 1, 'missions', 999999, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pe_pro_profiles_v1', 'pro', 1, 'profiles', 5, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pe_pro_contacts_v1', 'pro', 1, 'contacts', 200, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pe_pro_platforms_v1', 'pro', 1, 'platforms', 10, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pe_pro_companies_v1', 'pro', 1, 'companies', 50, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pe_pro_billingclients_v1', 'pro', 1, 'billingClients', 10, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pe_pro_billingquotes_v1', 'pro', 1, 'billingQuotes', 50, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pe_pro_billinginvoices_v1', 'pro', 1, 'billingInvoices', 50, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pe_pro_billingcatalog_v1', 'pro', 1, 'billingCatalogItems', 25, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pe_pro_airequests_v1', 'pro', 1, 'aiRequestsPerMonth', 50, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pe_pro_analyticshistory_v1', 'pro', 1, 'analyticsHistoryDays', 90, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pe_pro_cvdocuments_v1', 'pro', 1, 'cvDocuments', 10, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pe_pro_cvtemplatesall_v1', 'pro', 1, 'cvTemplatesAll', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pe_pro_cvcoachai_v1', 'pro', 1, 'cvCoachAI', 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pe_pro_atsscoring_v1', 'pro', 1, 'atsScoring', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pe_pro_autofollowups_v1', 'pro', 1, 'autoFollowUps', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pe_pro_sequences_v1', 'pro', 1, 'sequences', 3, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pe_pro_messagetemplates_v1', 'pro', 1, 'messageTemplates', 20, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pe_pro_csvexport_v1', 'pro', 1, 'csvExport', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pe_pro_aiemailgen_v1', 'pro', 1, 'aiEmailGeneration', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pe_pro_ailinkedinaudit_v1', 'pro', 1, 'aiLinkedinAudit', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

  ('pe_ultra_missions_v1', 'ultra', 1, 'missions', 999999, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pe_ultra_profiles_v1', 'ultra', 1, 'profiles', 999999, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pe_ultra_contacts_v1', 'ultra', 1, 'contacts', 999999, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pe_ultra_platforms_v1', 'ultra', 1, 'platforms', 999999, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pe_ultra_companies_v1', 'ultra', 1, 'companies', 999999, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pe_ultra_billingclients_v1', 'ultra', 1, 'billingClients', 999999, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pe_ultra_billingquotes_v1', 'ultra', 1, 'billingQuotes', 999999, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pe_ultra_billinginvoices_v1', 'ultra', 1, 'billingInvoices', 999999, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pe_ultra_billingcatalog_v1', 'ultra', 1, 'billingCatalogItems', 999999, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pe_ultra_airequests_v1', 'ultra', 1, 'aiRequestsPerMonth', 999, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pe_ultra_analyticshistory_v1', 'ultra', 1, 'analyticsHistoryDays', 999999, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pe_ultra_cvdocuments_v1', 'ultra', 1, 'cvDocuments', 999999, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pe_ultra_cvtemplatesall_v1', 'ultra', 1, 'cvTemplatesAll', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pe_ultra_cvcoachai_v1', 'ultra', 1, 'cvCoachAI', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pe_ultra_atsscoring_v1', 'ultra', 1, 'atsScoring', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pe_ultra_autofollowups_v1', 'ultra', 1, 'autoFollowUps', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pe_ultra_sequences_v1', 'ultra', 1, 'sequences', 999999, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pe_ultra_messagetemplates_v1', 'ultra', 1, 'messageTemplates', 999999, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pe_ultra_csvexport_v1', 'ultra', 1, 'csvExport', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pe_ultra_aiemailgen_v1', 'ultra', 1, 'aiEmailGeneration', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pe_ultra_ailinkedinaudit_v1', 'ultra', 1, 'aiLinkedinAudit', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
