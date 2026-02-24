-- CreateEnum
CREATE TYPE "public"."AIChatMessageRole" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM', 'TOOL');

-- CreateEnum
CREATE TYPE "public"."RecommendationType" AS ENUM ('PLATFORM_PERF', 'TEMPLATE_PERF', 'BEST_TIME', 'SKILL_GAP', 'APPROACH_STYLE');

-- CreateEnum
CREATE TYPE "public"."SnapshotType" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."AIFeature" ADD VALUE 'CHAT';
ALTER TYPE "public"."AIFeature" ADD VALUE 'LINKEDIN_POST';
ALTER TYPE "public"."AIFeature" ADD VALUE 'PROFILE_IMPROVEMENT';
ALTER TYPE "public"."AIFeature" ADD VALUE 'STRUCTURED_SCORING';
ALTER TYPE "public"."AIFeature" ADD VALUE 'LINKEDIN_AUDIT';

-- AlterTable
ALTER TABLE "public"."billing_payment" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."platform" ADD COLUMN     "logoUrl" TEXT;

-- CreateTable
CREATE TABLE "public"."ai_chat_thread" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Nouvelle conversation',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_chat_thread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ai_chat_message" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "role" "public"."AIChatMessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "toolCalls" JSONB,
    "toolResults" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_chat_message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ai_recommendation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "public"."RecommendationType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "data" JSONB,
    "score" INTEGER NOT NULL DEFAULT 0,
    "dismissedAt" TIMESTAMP(3),
    "actedOnAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_recommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."analytics_snapshot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "public"."SnapshotType" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_snapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."calendar_feed_token" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "calendar_feed_token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."client_portal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "customBio" TEXT,
    "showSkills" BOOLEAN NOT NULL DEFAULT true,
    "showExperiences" BOOLEAN NOT NULL DEFAULT true,
    "showEducation" BOOLEAN NOT NULL DEFAULT true,
    "showProjects" BOOLEAN NOT NULL DEFAULT true,
    "showLanguages" BOOLEAN NOT NULL DEFAULT true,
    "showTjm" BOOLEAN NOT NULL DEFAULT false,
    "showAvailability" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_portal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."daily_strategy" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "summary" TEXT NOT NULL,
    "priorities" JSONB NOT NULL,
    "quickWins" JSONB NOT NULL,
    "risks" JSONB NOT NULL,
    "completedPriorities" JSONB NOT NULL DEFAULT '[]',
    "completedQuickWins" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_strategy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."follow_up_rule" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "missionStatus" "public"."MissionStatus" NOT NULL,
    "delayDays" INTEGER NOT NULL,
    "followUpType" "public"."FollowUpType" NOT NULL,
    "templateId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "follow_up_rule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."linkedin_audit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "overallScore" INTEGER NOT NULL,
    "sections" JSONB NOT NULL,
    "strengths" TEXT[],
    "gaps" TEXT[],
    "quickWins" TEXT[],
    "actionPlan" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "linkedin_audit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."push_subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "push_subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."message_template_usage" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "missionId" TEXT,
    "channel" TEXT NOT NULL,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_template_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_preference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'fr',
    "theme" TEXT NOT NULL DEFAULT 'system',
    "notifyFollowUpDue" BOOLEAN NOT NULL DEFAULT true,
    "notifyMissionStale" BOOLEAN NOT NULL DEFAULT true,
    "notifyAiQuota" BOOLEAN NOT NULL DEFAULT true,
    "weeklyDigest" BOOLEAN NOT NULL DEFAULT false,
    "pushFollowUpDue" BOOLEAN NOT NULL DEFAULT true,
    "pushMissionStale" BOOLEAN NOT NULL DEFAULT true,
    "pushAiQuota" BOOLEAN NOT NULL DEFAULT false,
    "pushWeeklyDigest" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_preference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_chat_thread_userId_idx" ON "public"."ai_chat_thread"("userId");

-- CreateIndex
CREATE INDEX "ai_chat_message_threadId_idx" ON "public"."ai_chat_message"("threadId");

-- CreateIndex
CREATE INDEX "ai_recommendation_userId_dismissedAt_idx" ON "public"."ai_recommendation"("userId", "dismissedAt");

-- CreateIndex
CREATE INDEX "analytics_snapshot_userId_type_idx" ON "public"."analytics_snapshot"("userId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "analytics_snapshot_userId_type_date_key" ON "public"."analytics_snapshot"("userId", "type", "date");

-- CreateIndex
CREATE UNIQUE INDEX "calendar_feed_token_userId_key" ON "public"."calendar_feed_token"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "calendar_feed_token_token_key" ON "public"."calendar_feed_token"("token");

-- CreateIndex
CREATE UNIQUE INDEX "client_portal_slug_key" ON "public"."client_portal"("slug");

-- CreateIndex
CREATE INDEX "client_portal_slug_idx" ON "public"."client_portal"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "client_portal_userId_profileId_key" ON "public"."client_portal"("userId", "profileId");

-- CreateIndex
CREATE UNIQUE INDEX "daily_strategy_userId_date_key" ON "public"."daily_strategy"("userId", "date");

-- CreateIndex
CREATE INDEX "follow_up_rule_userId_isActive_idx" ON "public"."follow_up_rule"("userId", "isActive");

-- CreateIndex
CREATE INDEX "linkedin_audit_userId_idx" ON "public"."linkedin_audit"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "push_subscription_endpoint_key" ON "public"."push_subscription"("endpoint");

-- CreateIndex
CREATE INDEX "push_subscription_userId_idx" ON "public"."push_subscription"("userId");

-- CreateIndex
CREATE INDEX "message_template_usage_templateId_idx" ON "public"."message_template_usage"("templateId");

-- CreateIndex
CREATE INDEX "message_template_usage_userId_idx" ON "public"."message_template_usage"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_preference_userId_key" ON "public"."user_preference"("userId");

-- CreateIndex
CREATE INDEX "billing_payment_userId_deletedAt_idx" ON "public"."billing_payment"("userId", "deletedAt");

-- AddForeignKey
ALTER TABLE "public"."ai_chat_thread" ADD CONSTRAINT "ai_chat_thread_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ai_chat_message" ADD CONSTRAINT "ai_chat_message_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "public"."ai_chat_thread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ai_recommendation" ADD CONSTRAINT "ai_recommendation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."analytics_snapshot" ADD CONSTRAINT "analytics_snapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."calendar_feed_token" ADD CONSTRAINT "calendar_feed_token_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."client_portal" ADD CONSTRAINT "client_portal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."client_portal" ADD CONSTRAINT "client_portal_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "public"."user_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."daily_strategy" ADD CONSTRAINT "daily_strategy_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."follow_up_rule" ADD CONSTRAINT "follow_up_rule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."follow_up_rule" ADD CONSTRAINT "follow_up_rule_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "public"."message_template"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."linkedin_audit" ADD CONSTRAINT "linkedin_audit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."linkedin_audit" ADD CONSTRAINT "linkedin_audit_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "public"."user_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."push_subscription" ADD CONSTRAINT "push_subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."message_template_usage" ADD CONSTRAINT "message_template_usage_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "public"."message_template"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."message_template_usage" ADD CONSTRAINT "message_template_usage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."message_template_usage" ADD CONSTRAINT "message_template_usage_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "public"."mission"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_preference" ADD CONSTRAINT "user_preference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
