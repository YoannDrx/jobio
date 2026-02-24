-- AlterTable
ALTER TABLE "public"."cv_lab_document" ADD COLUMN     "contentOverrides" JSONB,
ADD COLUMN     "hiddenItems" JSONB,
ADD COLUMN     "masterCvId" TEXT,
ADD COLUMN     "personalInfo" JSONB;

-- CreateTable
CREATE TABLE "public"."master_cv" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "headline" TEXT,
    "summary" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "city" TEXT,
    "photoUrl" TEXT,
    "hobbies" JSONB,
    "driverLicenses" JSONB,
    "experiences" JSONB,
    "skills" JSONB,
    "education" JSONB,
    "projects" JSONB,
    "languages" JSONB,
    "certifications" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "master_cv_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "master_cv_userId_key" ON "public"."master_cv"("userId");

-- CreateIndex
CREATE INDEX "cv_lab_document_masterCvId_idx" ON "public"."cv_lab_document"("masterCvId");

-- AddForeignKey
ALTER TABLE "public"."master_cv" ADD CONSTRAINT "master_cv_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cv_lab_document" ADD CONSTRAINT "cv_lab_document_masterCvId_fkey" FOREIGN KEY ("masterCvId") REFERENCES "public"."master_cv"("id") ON DELETE SET NULL ON UPDATE CASCADE;
