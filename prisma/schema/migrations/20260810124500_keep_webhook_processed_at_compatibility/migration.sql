-- Keep the currently deployed webhook compatible during the rolling release.
-- The new ledger writes NULL explicitly while processing; older code relies on
-- the database default when inserting an already-processed event.
ALTER TABLE "stripe_webhook_event"
ALTER COLUMN "processedAt" SET DEFAULT CURRENT_TIMESTAMP;
