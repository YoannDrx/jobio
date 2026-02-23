-- CreateEnum
CREATE TYPE "PricingFunnelEventType" AS ENUM (
  'PRICING_PAGE_VIEWED',
  'PLAN_SELECTED',
  'CHECKOUT_STARTED',
  'SUBSCRIPTION_COMPLETED',
  'PAYWALL_HIT'
);

-- CreateTable
CREATE TABLE "pricing_funnel_event" (
  "id" TEXT NOT NULL,
  "eventType" "PricingFunnelEventType" NOT NULL,
  "userId" TEXT,
  "planCurrent" TEXT,
  "planTarget" TEXT,
  "billingCycle" TEXT,
  "entryPoint" TEXT,
  "featureKey" TEXT,
  "checkoutSessionId" TEXT,
  "stripeSubscriptionId" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "pricing_funnel_event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pricing_funnel_event_eventType_checkoutSessionId_key"
  ON "pricing_funnel_event" ("eventType", "checkoutSessionId");

-- CreateIndex
CREATE INDEX "pricing_funnel_event_createdAt_idx"
  ON "pricing_funnel_event" ("createdAt");

-- CreateIndex
CREATE INDEX "pricing_funnel_event_eventType_createdAt_idx"
  ON "pricing_funnel_event" ("eventType", "createdAt");

-- CreateIndex
CREATE INDEX "pricing_funnel_event_planTarget_eventType_createdAt_idx"
  ON "pricing_funnel_event" ("planTarget", "eventType", "createdAt");

-- CreateIndex
CREATE INDEX "pricing_funnel_event_userId_createdAt_idx"
  ON "pricing_funnel_event" ("userId", "createdAt");
