-- AlterTable
ALTER TABLE "mission" ADD COLUMN "profileId" TEXT;

-- AddForeignKey
ALTER TABLE "mission" ADD CONSTRAINT "mission_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "user_profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
