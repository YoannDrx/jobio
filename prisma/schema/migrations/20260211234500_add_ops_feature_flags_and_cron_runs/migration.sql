-- CreateEnum
CREATE TYPE "CronJobStatus" AS ENUM ('RUNNING', 'SUCCESS', 'FAILED', 'UNAUTHORIZED');

-- CreateTable
CREATE TABLE "feature_flag" (
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "scope" TEXT NOT NULL DEFAULT 'global',
    "updatedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feature_flag_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "cron_job_run" (
    "id" TEXT NOT NULL,
    "jobName" TEXT NOT NULL,
    "route" TEXT NOT NULL,
    "status" "CronJobStatus" NOT NULL DEFAULT 'RUNNING',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "durationMs" INTEGER,
    "processedCount" INTEGER,
    "details" JSONB,
    "errorMessage" TEXT,

    CONSTRAINT "cron_job_run_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "feature_flag_enabled_idx" ON "feature_flag"("enabled");

-- CreateIndex
CREATE INDEX "feature_flag_updatedAt_idx" ON "feature_flag"("updatedAt");

-- CreateIndex
CREATE INDEX "cron_job_run_jobName_startedAt_idx" ON "cron_job_run"("jobName", "startedAt");

-- CreateIndex
CREATE INDEX "cron_job_run_status_startedAt_idx" ON "cron_job_run"("status", "startedAt");

-- CreateIndex
CREATE INDEX "cron_job_run_startedAt_idx" ON "cron_job_run"("startedAt");
