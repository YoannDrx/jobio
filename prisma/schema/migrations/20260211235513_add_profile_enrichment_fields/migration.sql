-- AlterTable
ALTER TABLE "public"."user_profile" ADD COLUMN     "certifications" JSONB,
ADD COLUMN     "education" JSONB,
ADD COLUMN     "experiences" JSONB,
ADD COLUMN     "languages" JSONB;
