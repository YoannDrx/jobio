-- CreateEnum
CREATE TYPE "OpportunityDigestDeliveryStatus" AS ENUM ('PENDING', 'SENDING', 'SENT', 'FAILED');

-- CreateTable
CREATE TABLE "opportunity_digest_delivery" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "digestDate" DATE NOT NULL,
    "status" "OpportunityDigestDeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "providerEmailId" TEXT,
    "errorCode" TEXT,
    "claimedAt" TIMESTAMP(3),
    "lastAttemptAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "opportunity_digest_delivery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "opportunity_digest_delivery_userId_digestDate_key" ON "opportunity_digest_delivery"("userId", "digestDate");

-- CreateIndex
CREATE INDEX "opportunity_digest_delivery_status_lastAttemptAt_idx" ON "opportunity_digest_delivery"("status", "lastAttemptAt");

-- AddForeignKey
ALTER TABLE "opportunity_digest_delivery" ADD CONSTRAINT "opportunity_digest_delivery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
