-- Keep the database-backed entitlement release aligned with AUTH_PLANS.
-- This is data-only, idempotent, and does not lock or rewrite product tables.
INSERT INTO "plan_entitlement" (
  "id",
  "plan",
  "version",
  "featureKey",
  "value",
  "isActive",
  "createdAt",
  "updatedAt"
)
SELECT
  'pe_' || release."plan" || '_billingrecurring_v' || release."activeVersion",
  release."plan",
  release."activeVersion",
  'billingRecurringInvoices',
  CASE release."plan"
    WHEN 'free' THEN 0
    WHEN 'pro' THEN 5
    WHEN 'ultra' THEN 999999
  END,
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "plan_entitlement_release" AS release
WHERE release."plan" IN ('free', 'pro', 'ultra')
ON CONFLICT ("plan", "version", "featureKey") DO UPDATE SET
  "value" = EXCLUDED."value",
  "isActive" = true,
  "updatedAt" = CURRENT_TIMESTAMP;
