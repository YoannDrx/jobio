-- Preserve Stripe event ordering on the subscription projection.
ALTER TABLE "subscription"
ADD COLUMN "stripeEventCreatedAt" TIMESTAMP(3);

-- Durable idempotency ledger for signed Stripe webhook events.
CREATE TABLE "stripe_webhook_event" (
  "id" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "livemode" BOOLEAN NOT NULL,
  "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "stripe_webhook_event_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "stripe_webhook_event_processedAt_idx"
ON "stripe_webhook_event"("processedAt");
