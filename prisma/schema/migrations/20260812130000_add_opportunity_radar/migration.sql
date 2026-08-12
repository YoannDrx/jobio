CREATE TYPE "OpportunitySource" AS ENUM (
  'FRANCE_TRAVAIL',
  'ADZUNA',
  'JOOBLE',
  'INBOUND_EMAIL',
  'MANUAL'
);

CREATE TYPE "OpportunityMatchStatus" AS ENUM (
  'NEW',
  'SAVED',
  'DISMISSED',
  'CONVERTED',
  'EXPIRED'
);

CREATE TYPE "OpportunitySourceRunStatus" AS ENUM (
  'RUNNING',
  'SUCCEEDED',
  'FAILED',
  'SKIPPED'
);

CREATE TYPE "InboundOpportunityAlertStatus" AS ENUM (
  'RECEIVED',
  'PROCESSING',
  'PROCESSED',
  'REJECTED',
  'FAILED'
);

ALTER TABLE "ai_usage"
  ADD COLUMN "modelId" TEXT,
  ADD COLUMN "estimatedCostMicros" INTEGER,
  ADD COLUMN "latencyMs" INTEGER,
  ADD COLUMN "status" TEXT NOT NULL DEFAULT 'SUCCEEDED',
  ADD COLUMN "errorCode" TEXT,
  ADD COLUMN "requestId" TEXT,
  ADD COLUMN "context" JSONB;

ALTER TABLE "user_preference"
  ADD COLUMN "opportunityDigest" BOOLEAN NOT NULL DEFAULT true;

CREATE UNIQUE INDEX "ai_usage_requestId_key" ON "ai_usage"("requestId");

CREATE TABLE "opportunity_watch" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "criteria" JSONB NOT NULL,
  "sources" "OpportunitySource"[] NOT NULL,
  "cadence" TEXT NOT NULL DEFAULT 'DAILY',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "lastSyncedAt" TIMESTAMP(3),
  "syncStartedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "opportunity_watch_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "opportunity_listing" (
  "id" TEXT NOT NULL,
  "source" "OpportunitySource" NOT NULL,
  "externalIdentifier" TEXT NOT NULL,
  "canonicalUrl" TEXT,
  "fingerprint" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "company" TEXT,
  "description" TEXT,
  "location" TEXT,
  "workType" "WorkType",
  "skills" TEXT[] NOT NULL,
  "dailyRateMin" INTEGER,
  "dailyRateMax" INTEGER,
  "salaryMin" INTEGER,
  "salaryMax" INTEGER,
  "currency" TEXT NOT NULL DEFAULT 'EUR',
  "duration" TEXT,
  "provenance" JSONB NOT NULL,
  "publishedAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "opportunity_listing_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "opportunity_match" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "listingId" TEXT NOT NULL,
  "missionId" TEXT,
  "score" INTEGER NOT NULL,
  "breakdown" JSONB NOT NULL,
  "explanation" TEXT NOT NULL,
  "status" "OpportunityMatchStatus" NOT NULL DEFAULT 'NEW',
  "feedback" TEXT,
  "savedAt" TIMESTAMP(3),
  "dismissedAt" TIMESTAMP(3),
  "convertedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "opportunity_match_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "opportunity_watch_hit" (
  "id" TEXT NOT NULL,
  "watchId" TEXT NOT NULL,
  "listingId" TEXT NOT NULL,
  "firstMatchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastMatchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "opportunity_watch_hit_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "opportunity_source_run" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "watchId" TEXT NOT NULL,
  "provider" "OpportunitySource" NOT NULL,
  "status" "OpportunitySourceRunStatus" NOT NULL DEFAULT 'RUNNING',
  "cursor" TEXT,
  "fetchedCount" INTEGER NOT NULL DEFAULT 0,
  "matchedCount" INTEGER NOT NULL DEFAULT 0,
  "errorCode" TEXT,
  "errorMessage" TEXT,
  "latencyMs" INTEGER,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "finishedAt" TIMESTAMP(3),
  CONSTRAINT "opportunity_source_run_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "opportunity_inbox" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "addressToken" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "opportunity_inbox_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "inbound_opportunity_alert" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "inboxId" TEXT NOT NULL,
  "providerEmailId" TEXT NOT NULL,
  "recipient" TEXT NOT NULL,
  "senderDomain" TEXT,
  "subject" TEXT,
  "status" "InboundOpportunityAlertStatus" NOT NULL DEFAULT 'RECEIVED',
  "parsedCount" INTEGER NOT NULL DEFAULT 0,
  "errorCode" TEXT,
  "rawPurgedAt" TIMESTAMP(3),
  "receivedAt" TIMESTAMP(3) NOT NULL,
  "processedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "inbound_opportunity_alert_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "opportunity_listing_source_externalIdentifier_key" ON "opportunity_listing"("source", "externalIdentifier");
CREATE INDEX "opportunity_listing_fingerprint_idx" ON "opportunity_listing"("fingerprint");
CREATE INDEX "opportunity_listing_source_lastSeenAt_idx" ON "opportunity_listing"("source", "lastSeenAt");
CREATE INDEX "opportunity_listing_publishedAt_idx" ON "opportunity_listing"("publishedAt");
CREATE UNIQUE INDEX "opportunity_match_missionId_key" ON "opportunity_match"("missionId");
CREATE UNIQUE INDEX "opportunity_match_userId_listingId_key" ON "opportunity_match"("userId", "listingId");
CREATE INDEX "opportunity_match_userId_status_score_idx" ON "opportunity_match"("userId", "status", "score");
CREATE INDEX "opportunity_match_listingId_idx" ON "opportunity_match"("listingId");
CREATE UNIQUE INDEX "opportunity_watch_hit_watchId_listingId_key" ON "opportunity_watch_hit"("watchId", "listingId");
CREATE INDEX "opportunity_watch_hit_listingId_idx" ON "opportunity_watch_hit"("listingId");
CREATE INDEX "opportunity_watch_userId_isActive_idx" ON "opportunity_watch"("userId", "isActive");
CREATE INDEX "opportunity_watch_isActive_lastSyncedAt_idx" ON "opportunity_watch"("isActive", "lastSyncedAt");
CREATE INDEX "opportunity_source_run_watchId_startedAt_idx" ON "opportunity_source_run"("watchId", "startedAt");
CREATE INDEX "opportunity_source_run_userId_status_idx" ON "opportunity_source_run"("userId", "status");
CREATE UNIQUE INDEX "opportunity_inbox_userId_key" ON "opportunity_inbox"("userId");
CREATE UNIQUE INDEX "opportunity_inbox_addressToken_key" ON "opportunity_inbox"("addressToken");
CREATE UNIQUE INDEX "inbound_opportunity_alert_providerEmailId_key" ON "inbound_opportunity_alert"("providerEmailId");
CREATE INDEX "inbound_opportunity_alert_userId_receivedAt_idx" ON "inbound_opportunity_alert"("userId", "receivedAt");
CREATE INDEX "inbound_opportunity_alert_status_receivedAt_idx" ON "inbound_opportunity_alert"("status", "receivedAt");

ALTER TABLE "opportunity_watch" ADD CONSTRAINT "opportunity_watch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "opportunity_match" ADD CONSTRAINT "opportunity_match_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "opportunity_match" ADD CONSTRAINT "opportunity_match_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "opportunity_listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "opportunity_match" ADD CONSTRAINT "opportunity_match_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "mission"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "opportunity_watch_hit" ADD CONSTRAINT "opportunity_watch_hit_watchId_fkey" FOREIGN KEY ("watchId") REFERENCES "opportunity_watch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "opportunity_watch_hit" ADD CONSTRAINT "opportunity_watch_hit_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "opportunity_listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "opportunity_source_run" ADD CONSTRAINT "opportunity_source_run_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "opportunity_source_run" ADD CONSTRAINT "opportunity_source_run_watchId_fkey" FOREIGN KEY ("watchId") REFERENCES "opportunity_watch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "opportunity_inbox" ADD CONSTRAINT "opportunity_inbox_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inbound_opportunity_alert" ADD CONSTRAINT "inbound_opportunity_alert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inbound_opportunity_alert" ADD CONSTRAINT "inbound_opportunity_alert_inboxId_fkey" FOREIGN KEY ("inboxId") REFERENCES "opportunity_inbox"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "opportunity_match" ADD CONSTRAINT "opportunity_match_score_check" CHECK ("score" BETWEEN 0 AND 100);
ALTER TABLE "opportunity_listing" ADD CONSTRAINT "opportunity_listing_daily_rate_check" CHECK (("dailyRateMin" IS NULL OR "dailyRateMin" >= 0) AND ("dailyRateMax" IS NULL OR "dailyRateMax" >= 0));
ALTER TABLE "opportunity_listing" ADD CONSTRAINT "opportunity_listing_salary_check" CHECK (("salaryMin" IS NULL OR "salaryMin" >= 0) AND ("salaryMax" IS NULL OR "salaryMax" >= 0));
