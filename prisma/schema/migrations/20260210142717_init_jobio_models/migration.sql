-- CreateEnum
CREATE TYPE "public"."ActivityEventType" AS ENUM ('STATUS_CHANGE', 'NOTE_ADDED', 'CONTACT_LINKED', 'FOLLOW_UP_CREATED', 'FOLLOW_UP_COMPLETED', 'MISSION_CREATED', 'MISSION_UPDATED');

-- CreateEnum
CREATE TYPE "public"."AIFeature" AS ENUM ('MISSION_PARSING', 'OFFER_SCORING', 'APPLICATION_MESSAGE', 'FOLLOW_UP_MESSAGE', 'PROFILE_IMPORT');

-- CreateEnum
CREATE TYPE "public"."InteractionType" AS ENUM ('EMAIL', 'CALL', 'MEETING', 'LINKEDIN', 'MESSAGE', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."FollowUpType" AS ENUM ('EMAIL', 'CALL', 'MESSAGE', 'MEETING');

-- CreateEnum
CREATE TYPE "public"."TemplateType" AS ENUM ('FIRST_CONTACT', 'FOLLOW_UP_J3', 'FOLLOW_UP_J7', 'FOLLOW_UP_J14', 'POST_INTERVIEW', 'NEGOTIATION', 'THANK_YOU', 'CUSTOM');

-- CreateEnum
CREATE TYPE "public"."MissionStatus" AS ENUM ('A_POSTULER', 'POSTULE', 'ENTRETIEN', 'PROPOSITION', 'ACCEPTE', 'REFUSE', 'ARCHIVE');

-- CreateEnum
CREATE TYPE "public"."MissionPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "public"."WorkType" AS ENUM ('REMOTE', 'HYBRID', 'ONSITE');

-- CreateEnum
CREATE TYPE "public"."NotificationType" AS ENUM ('FOLLOW_UP_DUE', 'FOLLOW_UP_OVERDUE', 'MISSION_STALE', 'AI_QUOTA_HIGH', 'SYSTEM');

-- CreateEnum
CREATE TYPE "public"."PlatformCategory" AS ENUM ('GENERALIST', 'SPECIALIZED', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "public"."PlatformStatus" AS ENUM ('NOT_REGISTERED', 'REGISTERED', 'ACTIVE');

-- CreateTable
CREATE TABLE "public"."activity_event" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "public"."ActivityEventType" NOT NULL,
    "description" TEXT,
    "previousValue" TEXT,
    "newValue" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ai_usage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "feature" "public"."AIFeature" NOT NULL,
    "inputTokens" INTEGER NOT NULL,
    "outputTokens" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ai_monthly_quota" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "requestsUsed" INTEGER NOT NULL DEFAULT 0,
    "requestsLimit" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_monthly_quota_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."contact" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "company" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "linkedinUrl" TEXT,
    "role" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."contact_interaction" (
    "id" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "type" "public"."InteractionType" NOT NULL,
    "description" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contact_interaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."follow_up" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "public"."FollowUpType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "isOverdue" BOOLEAN NOT NULL DEFAULT false,
    "templateId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "follow_up_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."message_template" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "type" "public"."TemplateType" NOT NULL,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "variables" TEXT[],
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "message_template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."mission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "company" TEXT,
    "description" TEXT,
    "status" "public"."MissionStatus" NOT NULL DEFAULT 'A_POSTULER',
    "priority" "public"."MissionPriority" NOT NULL DEFAULT 'MEDIUM',
    "tjm" INTEGER,
    "duration" TEXT,
    "workType" "public"."WorkType",
    "location" TEXT,
    "stack" TEXT[],
    "sourceUrl" TEXT,
    "score" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "platformId" TEXT,
    "contactId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "mission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "public"."NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "link" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."platform" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "website" TEXT,
    "category" "public"."PlatformCategory" NOT NULL DEFAULT 'GENERALIST',
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_platform" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "platformId" TEXT NOT NULL,
    "profileUrl" TEXT,
    "status" "public"."PlatformStatus" NOT NULL DEFAULT 'NOT_REGISTERED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_platform_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_profile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "headline" TEXT NOT NULL,
    "bio" TEXT,
    "skills" JSONB,
    "tjmTarget" INTEGER,
    "workTypePreference" "public"."WorkType",
    "zone" TEXT,
    "minDuration" TEXT,
    "maxDuration" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_profile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ai_monthly_quota_userId_month_year_key" ON "public"."ai_monthly_quota"("userId", "month", "year");

-- CreateIndex
CREATE UNIQUE INDEX "platform_slug_key" ON "public"."platform"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "user_platform_userId_platformId_key" ON "public"."user_platform"("userId", "platformId");

-- AddForeignKey
ALTER TABLE "public"."activity_event" ADD CONSTRAINT "activity_event_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "public"."mission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."activity_event" ADD CONSTRAINT "activity_event_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ai_usage" ADD CONSTRAINT "ai_usage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ai_monthly_quota" ADD CONSTRAINT "ai_monthly_quota_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."contact" ADD CONSTRAINT "contact_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."contact_interaction" ADD CONSTRAINT "contact_interaction_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "public"."contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."follow_up" ADD CONSTRAINT "follow_up_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "public"."mission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."follow_up" ADD CONSTRAINT "follow_up_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."follow_up" ADD CONSTRAINT "follow_up_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "public"."message_template"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."message_template" ADD CONSTRAINT "message_template_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."mission" ADD CONSTRAINT "mission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."mission" ADD CONSTRAINT "mission_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES "public"."platform"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."mission" ADD CONSTRAINT "mission_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "public"."contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notification" ADD CONSTRAINT "notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_platform" ADD CONSTRAINT "user_platform_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_platform" ADD CONSTRAINT "user_platform_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES "public"."platform"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_profile" ADD CONSTRAINT "user_profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
