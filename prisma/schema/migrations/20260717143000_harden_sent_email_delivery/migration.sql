ALTER TABLE "sent_email"
ADD COLUMN "provider" TEXT NOT NULL DEFAULT 'resend',
ADD COLUMN "providerRequestId" TEXT,
ADD COLUMN "failureReason" TEXT,
ADD COLUMN "lastAttemptAt" TIMESTAMP(3),
ADD COLUMN "complainedAt" TIMESTAMP(3),
ADD COLUMN "suppressedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "sent_email_providerRequestId_key"
ON "sent_email"("providerRequestId");

CREATE INDEX "sent_email_userId_status_createdAt_idx"
ON "sent_email"("userId", "status", "createdAt");
