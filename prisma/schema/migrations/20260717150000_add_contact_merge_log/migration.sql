CREATE TABLE "contact_merge_log" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "targetContactId" TEXT NOT NULL,
  "sourceContactId" TEXT NOT NULL,
  "targetSnapshot" JSONB NOT NULL,
  "sourceSnapshot" JSONB NOT NULL,
  "movedMissionIds" TEXT[] NOT NULL,
  "movedInteractionIds" TEXT[] NOT NULL,
  "movedSentEmailIds" TEXT[] NOT NULL,
  "movedTargetCompanyIds" TEXT[] NOT NULL,
  "targetUpdatedAtAfterMerge" TIMESTAMP(3) NOT NULL,
  "mergedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "undoneAt" TIMESTAMP(3),
  CONSTRAINT "contact_merge_log_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "contact_merge_log_userId_mergedAt_idx" ON "contact_merge_log"("userId", "mergedAt");
CREATE INDEX "contact_merge_log_targetContactId_idx" ON "contact_merge_log"("targetContactId");
CREATE INDEX "contact_merge_log_sourceContactId_idx" ON "contact_merge_log"("sourceContactId");

ALTER TABLE "contact_merge_log" ADD CONSTRAINT "contact_merge_log_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "contact_merge_log" ADD CONSTRAINT "contact_merge_log_targetContactId_fkey"
FOREIGN KEY ("targetContactId") REFERENCES "contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "contact_merge_log" ADD CONSTRAINT "contact_merge_log_sourceContactId_fkey"
FOREIGN KEY ("sourceContactId") REFERENCES "contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
