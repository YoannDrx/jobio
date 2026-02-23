-- AlterTable
ALTER TABLE "cv_lab_document" ADD COLUMN IF NOT EXISTS "shareToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "cv_lab_document_shareToken_key" ON "cv_lab_document"("shareToken");
