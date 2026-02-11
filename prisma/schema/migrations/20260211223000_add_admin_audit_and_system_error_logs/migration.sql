-- CreateEnum
CREATE TYPE "SystemErrorSeverity" AS ENUM ('INFO', 'WARNING', 'ERROR', 'CRITICAL');

-- CreateTable
CREATE TABLE "admin_audit_log" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "actorEmail" TEXT NOT NULL,
    "targetUserId" TEXT,
    "targetEmail" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_error_log" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "stack" TEXT,
    "severity" "SystemErrorSeverity" NOT NULL DEFAULT 'ERROR',
    "context" JSONB,
    "userId" TEXT,
    "userEmail" TEXT,
    "route" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_error_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "admin_audit_log_createdAt_idx" ON "admin_audit_log"("createdAt");

-- CreateIndex
CREATE INDEX "admin_audit_log_actorUserId_createdAt_idx" ON "admin_audit_log"("actorUserId", "createdAt");

-- CreateIndex
CREATE INDEX "admin_audit_log_targetUserId_createdAt_idx" ON "admin_audit_log"("targetUserId", "createdAt");

-- CreateIndex
CREATE INDEX "system_error_log_createdAt_idx" ON "system_error_log"("createdAt");

-- CreateIndex
CREATE INDEX "system_error_log_severity_createdAt_idx" ON "system_error_log"("severity", "createdAt");

-- CreateIndex
CREATE INDEX "system_error_log_resolvedAt_idx" ON "system_error_log"("resolvedAt");
