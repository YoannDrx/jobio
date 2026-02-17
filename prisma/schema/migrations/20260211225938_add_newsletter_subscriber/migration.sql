-- CreateTable
CREATE TABLE "public"."newsletter_subscriber" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'landing',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "newsletter_subscriber_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "newsletter_subscriber_email_key" ON "public"."newsletter_subscriber"("email");

-- CreateIndex
CREATE INDEX "newsletter_subscriber_createdAt_idx" ON "public"."newsletter_subscriber"("createdAt");
