-- Stripe doesn't guarantee webhook delivery order. Keep the timestamp of the
-- last event applied to a lifetime-program purchase so an older checkout or
-- refund event cannot overwrite a newer access decision.
ALTER TABLE "program_purchase"
ADD COLUMN "stripeEventCreatedAt" TIMESTAMP(3);
