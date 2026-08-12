-- The trial identity is a pseudonymous anti-abuse record. A purge date is
-- assigned when the related Jobio account is deleted.
ALTER TABLE "pro_trial_identity"
ADD COLUMN "retentionExpiresAt" TIMESTAMP(3);
