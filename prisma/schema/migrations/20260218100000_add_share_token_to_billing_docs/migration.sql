-- AlterTable
ALTER TABLE "billing_quote" ADD COLUMN "shareToken" TEXT;

-- AlterTable
ALTER TABLE "billing_invoice" ADD COLUMN "shareToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "billing_quote_shareToken_key" ON "billing_quote"("shareToken");

-- CreateIndex
CREATE UNIQUE INDEX "billing_invoice_shareToken_key" ON "billing_invoice"("shareToken");
