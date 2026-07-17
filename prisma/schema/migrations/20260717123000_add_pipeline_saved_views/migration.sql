CREATE TABLE "pipeline_saved_view" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "state" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "pipeline_saved_view_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "pipeline_saved_view_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "user"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "pipeline_saved_view_userId_name_key"
  ON "pipeline_saved_view"("userId", "name");

CREATE INDEX "pipeline_saved_view_userId_updatedAt_idx"
  ON "pipeline_saved_view"("userId", "updatedAt");
