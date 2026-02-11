-- CreateTable
CREATE TABLE "public"."linkedin_program" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "longDescription" TEXT,
    "authorName" TEXT NOT NULL,
    "authorImage" TEXT,
    "price" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'eur',
    "isFree" BOOLEAN NOT NULL DEFAULT false,
    "templateCount" INTEGER NOT NULL DEFAULT 0,
    "coverImage" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "stripeProductId" TEXT,
    "stripePriceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "linkedin_program_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."linkedin_template" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "hook" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "tips" TEXT,
    "category" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "linkedin_template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."program_purchase" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "stripeSessionId" TEXT,
    "stripePaymentIntentId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "amount" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'eur',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "program_purchase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "linkedin_program_slug_key" ON "public"."linkedin_program"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "program_purchase_stripeSessionId_key" ON "public"."program_purchase"("stripeSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "program_purchase_userId_programId_key" ON "public"."program_purchase"("userId", "programId");

-- AddForeignKey
ALTER TABLE "public"."linkedin_template" ADD CONSTRAINT "linkedin_template_programId_fkey" FOREIGN KEY ("programId") REFERENCES "public"."linkedin_program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."program_purchase" ADD CONSTRAINT "program_purchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."program_purchase" ADD CONSTRAINT "program_purchase_programId_fkey" FOREIGN KEY ("programId") REFERENCES "public"."linkedin_program"("id") ON DELETE CASCADE ON UPDATE CASCADE;
