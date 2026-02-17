-- CreateEnum
CREATE TYPE "CvLabCoachSessionStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CvLabCoachMessageRole" AS ENUM ('USER', 'ASSISTANT');

-- AlterEnum
ALTER TYPE "AIFeature" ADD VALUE 'CV_COACH';

-- CreateTable
CREATE TABLE "cv_lab_coach_session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "profileId" TEXT,
    "name" TEXT NOT NULL DEFAULT 'Session CV',
    "status" "CvLabCoachSessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "goalRole" TEXT,
    "structuredSnapshot" JSONB,
    "missingItems" JSONB,
    "inconsistencies" JSONB,
    "nextQuestions" JSONB,
    "completenessScore" INTEGER NOT NULL DEFAULT 0,
    "lastExtractedAt" TIMESTAMP(3),
    "lockedFields" JSONB,
    "sourceEvidence" JSONB,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cv_lab_coach_session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cv_lab_coach_message" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "CvLabCoachMessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cv_lab_coach_message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cv_lab_coach_session_userId_updatedAt_idx" ON "cv_lab_coach_session"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "cv_lab_coach_session_profileId_idx" ON "cv_lab_coach_session"("profileId");

-- CreateIndex
CREATE INDEX "cv_lab_coach_message_sessionId_createdAt_idx" ON "cv_lab_coach_message"("sessionId", "createdAt");

-- CreateIndex
CREATE INDEX "cv_lab_coach_message_userId_createdAt_idx" ON "cv_lab_coach_message"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "cv_lab_coach_session" ADD CONSTRAINT "cv_lab_coach_session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cv_lab_coach_session" ADD CONSTRAINT "cv_lab_coach_session_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "user_profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cv_lab_coach_message" ADD CONSTRAINT "cv_lab_coach_message_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "cv_lab_coach_session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cv_lab_coach_message" ADD CONSTRAINT "cv_lab_coach_message_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
