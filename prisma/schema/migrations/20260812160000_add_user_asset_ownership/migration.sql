-- CreateEnum
CREATE TYPE "UserAssetStorageProvider" AS ENUM ('LOCAL', 'VERCEL_BLOB');

-- CreateTable
CREATE TABLE "user_asset" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "pathname" TEXT NOT NULL,
    "provider" "UserAssetStorageProvider" NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_asset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_asset_url_key" ON "user_asset"("url");

-- CreateIndex
CREATE INDEX "user_asset_userId_createdAt_idx" ON "user_asset"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "user_asset" ADD CONSTRAINT "user_asset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
