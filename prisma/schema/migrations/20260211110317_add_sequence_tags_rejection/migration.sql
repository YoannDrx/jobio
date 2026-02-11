-- AlterTable
ALTER TABLE "public"."contact" ADD COLUMN     "tags" TEXT[];

-- AlterTable
ALTER TABLE "public"."mission" ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "scoreBreakdown" JSONB;

-- CreateTable
CREATE TABLE "public"."sequence" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "steps" JSONB NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sequence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sequence_userId_idx" ON "public"."sequence"("userId");

-- AddForeignKey
ALTER TABLE "public"."sequence" ADD CONSTRAINT "sequence_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
