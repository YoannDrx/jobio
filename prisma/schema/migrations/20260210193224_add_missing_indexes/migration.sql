-- AlterEnum
ALTER TYPE "public"."AIFeature" ADD VALUE 'EMAIL_WRITING';

-- AlterEnum
ALTER TYPE "public"."ActivityEventType" ADD VALUE 'EMAIL_SENT';

-- CreateTable
CREATE TABLE "public"."sent_email" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "missionId" TEXT,
    "contactId" TEXT,
    "templateId" TEXT,
    "to" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'sent',
    "isDraft" BOOLEAN NOT NULL DEFAULT false,
    "resendId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3),
    "clickedAt" TIMESTAMP(3),
    "bouncedAt" TIMESTAMP(3),

    CONSTRAINT "sent_email_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sent_email_resendId_key" ON "public"."sent_email"("resendId");

-- CreateIndex
CREATE INDEX "sent_email_userId_createdAt_idx" ON "public"."sent_email"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "sent_email_resendId_idx" ON "public"."sent_email"("resendId");

-- CreateIndex
CREATE INDEX "sent_email_userId_isDraft_idx" ON "public"."sent_email"("userId", "isDraft");

-- CreateIndex
CREATE INDEX "activity_event_missionId_createdAt_idx" ON "public"."activity_event"("missionId", "createdAt");

-- CreateIndex
CREATE INDEX "contact_userId_deletedAt_idx" ON "public"."contact"("userId", "deletedAt");

-- CreateIndex
CREATE INDEX "follow_up_userId_scheduledAt_idx" ON "public"."follow_up"("userId", "scheduledAt");

-- CreateIndex
CREATE INDEX "follow_up_missionId_idx" ON "public"."follow_up"("missionId");

-- CreateIndex
CREATE INDEX "follow_up_userId_scheduledAt_completedAt_idx" ON "public"."follow_up"("userId", "scheduledAt", "completedAt");

-- CreateIndex
CREATE INDEX "follow_up_missionId_userId_idx" ON "public"."follow_up"("missionId", "userId");

-- CreateIndex
CREATE INDEX "mission_userId_status_idx" ON "public"."mission"("userId", "status");

-- CreateIndex
CREATE INDEX "mission_userId_createdAt_idx" ON "public"."mission"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "mission_userId_deletedAt_idx" ON "public"."mission"("userId", "deletedAt");

-- CreateIndex
CREATE INDEX "mission_userId_status_deletedAt_idx" ON "public"."mission"("userId", "status", "deletedAt");

-- CreateIndex
CREATE INDEX "notification_userId_read_idx" ON "public"."notification"("userId", "read");

-- AddForeignKey
ALTER TABLE "public"."sent_email" ADD CONSTRAINT "sent_email_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sent_email" ADD CONSTRAINT "sent_email_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "public"."mission"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sent_email" ADD CONSTRAINT "sent_email_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "public"."contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sent_email" ADD CONSTRAINT "sent_email_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "public"."message_template"("id") ON DELETE SET NULL ON UPDATE CASCADE;
