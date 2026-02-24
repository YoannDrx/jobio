-- AlterTable
ALTER TABLE "public"."cv_lab_document" ADD COLUMN     "coachSessionId" TEXT;

-- CreateIndex
CREATE INDEX "cv_lab_document_coachSessionId_idx" ON "public"."cv_lab_document"("coachSessionId");

-- AddForeignKey
ALTER TABLE "public"."cv_lab_document" ADD CONSTRAINT "cv_lab_document_coachSessionId_fkey" FOREIGN KEY ("coachSessionId") REFERENCES "public"."cv_lab_coach_session"("id") ON DELETE SET NULL ON UPDATE CASCADE;
