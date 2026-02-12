-- CreateEnum
CREATE TYPE "public"."CompanySize" AS ENUM ('STARTUP', 'PME', 'ETI', 'GRAND_GROUPE');

-- CreateEnum
CREATE TYPE "public"."ProspectionStatus" AS ENUM ('A_DEMARCHER', 'CONTACTE', 'EN_DISCUSSION', 'REFUSE');

-- CreateTable
CREATE TABLE "public"."target_company" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "website" TEXT,
    "notes" TEXT,
    "sector" TEXT,
    "size" "public"."CompanySize",
    "status" "public"."ProspectionStatus" NOT NULL DEFAULT 'A_DEMARCHER',
    "contactId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "target_company_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "target_company_userId_idx" ON "public"."target_company"("userId");

-- AddForeignKey
ALTER TABLE "public"."target_company" ADD CONSTRAINT "target_company_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."target_company" ADD CONSTRAINT "target_company_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "public"."contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Insert missing platforms (for existing databases)
INSERT INTO "public"."platform" ("id", "name", "slug", "website", "category", "isSystem", "createdAt")
VALUES
  ('plt_chrypck01', 'CherryPick', 'cherrypick', 'https://www.cherrypick.io', 'SPECIALIZED', true, NOW()),
  ('plt_mndqst001', 'MindQuest', 'mindquest', 'https://www.mindquest.io', 'SPECIALIZED', true, NOW()),
  ('plt_legrtn001', 'LeGratin', 'legratin', 'https://www.legratin.co', 'SPECIALIZED', true, NOW()),
  ('plt_jnehpe001', 'Jane Hope', 'jane-hope', 'https://www.janehope.com', 'SPECIALIZED', true, NOW()),
  ('plt_tchplc001', 'Techplaces', 'techplaces', 'https://www.techplaces.io', 'SPECIALIZED', true, NOW()),
  ('plt_frldyd001', 'FreelanceDay', 'freelanceday', 'https://www.freelanceday.com', 'GENERALIST', true, NOW()),
  ('plt_larlve001', 'La Relève', 'la-releve', 'https://www.lareleve.co', 'SPECIALIZED', true, NOW()),
  ('plt_mbljbs001', 'Mobile Jobs', 'mobile-jobs', 'https://www.mobilejobs.fr', 'SPECIALIZED', true, NOW()),
  ('plt_slsheo001', 'Slasheo', 'slasheo', 'https://www.slasheo.com', 'SPECIALIZED', true, NOW()),
  ('plt_trtdun001', 'Trait d''Union', 'trait-d-union', 'https://www.traitdunion.co', 'SPECIALIZED', true, NOW()),
  ('plt_wekey0001', 'Wekey', 'wekey', 'https://www.wekey.co', 'SPECIALIZED', true, NOW()),
  ('plt_yeets0001', 'Yeets', 'yeets', 'https://www.yeets.co', 'SPECIALIZED', true, NOW()),
  ('plt_blmays001', 'Bloomays', 'bloomays', 'https://www.bloomays.com', 'SPECIALIZED', true, NOW()),
  ('plt_mbskll001', 'Mobiskill', 'mobiskill', 'https://www.mobiskill.fr', 'SPECIALIZED', true, NOW()),
  ('plt_nxtmnd001', 'Next Mondays', 'next-mondays', 'https://www.nextmondays.com', 'SPECIALIZED', true, NOW()),
  ('plt_frlcrs001', 'Freelanceurs.io', 'freelanceurs-io', 'https://www.freelanceurs.io', 'GENERALIST', true, NOW()),
  ('plt_agrega001', 'Agrega', 'agrega', 'https://www.agrega.fr', 'ENTERPRISE', true, NOW()),
  ('plt_hmncrft01', 'Humancraft', 'humancraft', 'https://www.humancraft.co', 'SPECIALIZED', true, NOW()),
  ('plt_upfast001', 'Upfast', 'upfast', 'https://www.upfast.io', 'SPECIALIZED', true, NOW())
ON CONFLICT ("slug") DO NOTHING;
