-- CreateEnum
CREATE TYPE "CvLabTemplate" AS ENUM ('CLASSIC', 'TWO_COLUMN', 'EXECUTIVE', 'COMPACT');

-- CreateEnum
CREATE TYPE "CvLabTheme" AS ENUM ('MINIMAL', 'MODERN', 'CONTRAST', 'BOLD');

-- CreateEnum
CREATE TYPE "CvLabPageSize" AS ENUM ('A4', 'LETTER');

-- CreateTable
CREATE TABLE "cv_lab_document" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "targetRole" TEXT,
    "template" "CvLabTemplate" NOT NULL DEFAULT 'CLASSIC',
    "theme" "CvLabTheme" NOT NULL DEFAULT 'MODERN',
    "pageSize" "CvLabPageSize" NOT NULL DEFAULT 'A4',
    "accentColor" TEXT NOT NULL DEFAULT '#0f172a',
    "fontFamily" TEXT NOT NULL DEFAULT 'Inter',
    "headlineOverride" TEXT,
    "summaryOverride" TEXT,
    "sectionOrder" JSONB,
    "hiddenSections" JSONB,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cv_lab_document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cv_lab_document_version" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cv_lab_document_version_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_user_note" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "authorUserId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_user_note_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cv_lab_document_userId_updatedAt_idx" ON "cv_lab_document"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "cv_lab_document_profileId_idx" ON "cv_lab_document"("profileId");

-- CreateIndex
CREATE INDEX "cv_lab_document_version_documentId_createdAt_idx" ON "cv_lab_document_version"("documentId", "createdAt");

-- CreateIndex
CREATE INDEX "cv_lab_document_version_userId_createdAt_idx" ON "cv_lab_document_version"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "admin_user_note_userId_createdAt_idx" ON "admin_user_note"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "admin_user_note_authorUserId_createdAt_idx" ON "admin_user_note"("authorUserId", "createdAt");

-- AddForeignKey
ALTER TABLE "cv_lab_document" ADD CONSTRAINT "cv_lab_document_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cv_lab_document" ADD CONSTRAINT "cv_lab_document_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "user_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cv_lab_document_version" ADD CONSTRAINT "cv_lab_document_version_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "cv_lab_document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cv_lab_document_version" ADD CONSTRAINT "cv_lab_document_version_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_user_note" ADD CONSTRAINT "admin_user_note_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_user_note" ADD CONSTRAINT "admin_user_note_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
