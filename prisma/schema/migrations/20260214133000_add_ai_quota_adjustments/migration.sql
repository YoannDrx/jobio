-- CreateTable
CREATE TABLE "ai_quota_adjustment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "mode" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "previousRequestsLimit" INTEGER NOT NULL,
    "nextRequestsLimit" INTEGER NOT NULL,
    "previousRequestsUsed" INTEGER NOT NULL,
    "nextRequestsUsed" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_quota_adjustment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_quota_adjustment_userId_createdAt_idx" ON "ai_quota_adjustment"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ai_quota_adjustment_actorUserId_createdAt_idx" ON "ai_quota_adjustment"("actorUserId", "createdAt");

-- CreateIndex
CREATE INDEX "ai_quota_adjustment_userId_month_year_idx" ON "ai_quota_adjustment"("userId", "month", "year");

-- AddForeignKey
ALTER TABLE "ai_quota_adjustment" ADD CONSTRAINT "ai_quota_adjustment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_quota_adjustment" ADD CONSTRAINT "ai_quota_adjustment_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
