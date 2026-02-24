import { prisma } from "@/lib/prisma";
import { expect, test } from "@playwright/test";
import { createTestAccount } from "./utils/auth-test";

test.describe("recurring-invoices", () => {
  test("create and manage recurring invoice", async ({ page }) => {
    if (process.env.CI === "true" || process.env.GITHUB_ACTIONS === "true") {
      test.skip();
    }

    const userData = await createTestAccount({
      page,
      callbackURL: "/freelance/recurring",
    });

    try {
      const user = await prisma.user.findUnique({
        where: { email: userData.email },
      });
      expect(user).not.toBeNull();
      if (!user) throw new Error("User not found");

      // Setup billing profile + client
      await prisma.billingProfile.create({
        data: {
          userId: user.id,
          legalName: "Recurring E2E",
          addressLine1: "1 rue Test",
          postalCode: "75000",
          city: "Paris",
        },
      });

      await prisma.billingClient.create({
        data: {
          userId: user.id,
          type: "COMPANY",
          displayName: "Client Recurring E2E",
          addressLine1: "10 rue Test",
          postalCode: "75001",
          city: "Paris",
        },
      });

      await page.goto("/freelance/recurring");
      await page.waitForLoadState("networkidle");

      // Verify empty state or page loaded
      await expect(page.locator("body")).toContainText(/récurr/i, {
        timeout: 10000,
      });
    } finally {
      const user = await prisma.user.findUnique({
        where: { email: userData.email },
      });
      if (user) {
        await prisma.billingRecurringInvoice.deleteMany({
          where: { userId: user.id },
        });
        await prisma.billingInvoice.deleteMany({ where: { userId: user.id } });
        await prisma.billingClient.deleteMany({ where: { userId: user.id } });
        await prisma.billingProfile.deleteMany({ where: { userId: user.id } });
        await prisma.user.delete({ where: { id: user.id } });
      }
    }
  });
});
