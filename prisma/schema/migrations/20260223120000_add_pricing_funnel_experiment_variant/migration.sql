-- AlterTable
ALTER TABLE "pricing_funnel_event"
  ADD COLUMN "experimentVariant" TEXT;

-- CreateIndex
CREATE INDEX "pricing_funnel_event_experimentVariant_eventType_createdAt_idx"
  ON "pricing_funnel_event" ("experimentVariant", "eventType", "createdAt");
