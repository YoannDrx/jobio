import { prisma } from "@/lib/prisma";
import { expect, test } from "@playwright/test";
import { createTestAccount } from "./utils/auth-test";

test.describe("freelance-billing", () => {
  test("quote to invoice payment flow", async ({ page }) => {
    const userData = await createTestAccount({
      page,
      callbackURL: "/freelance/quotes",
    });

    try {
      const user = await prisma.user.findUnique({
        where: { email: userData.email },
      });
      expect(user).not.toBeNull();

      if (!user) {
        throw new Error("User not found after signup");
      }

      await prisma.billingClient.create({
        data: {
          userId: user.id,
          type: "COMPANY",
          displayName: "Client E2E",
          legalName: "Client E2E SARL",
          email: "facturation@cliente2e.test",
          addressLine1: "10 rue des Tests",
          postalCode: "75001",
          city: "Paris",
          countryCode: "FR",
          paymentTermsInDays: 30,
          tags: [],
        },
      });

      await page.goto("/freelance/quotes");
      await page.waitForLoadState("networkidle");

      await expect(page.getByText("Créer un devis rapide")).toBeVisible({
        timeout: 10000,
      });

      await page.getByRole("button", { name: "Créer le devis" }).click();
      await expect(page.getByText("Devis brouillon créé")).toBeVisible({
        timeout: 10000,
      });

      await expect(
        page.getByRole("cell", { name: "Client E2E" }).first(),
      ).toBeVisible({ timeout: 10000 });

      await page
        .getByRole("button", { name: "Convertir en facture" })
        .first()
        .click();
      await expect(page.getByText("Devis converti en facture")).toBeVisible({
        timeout: 10000,
      });

      await page.goto("/freelance/invoices");
      await page.waitForLoadState("networkidle");

      await expect(
        page.getByRole("heading", { name: "Factures" }).first(),
      ).toBeVisible({
        timeout: 10000,
      });

      await page.getByRole("button", { name: "Émettre" }).click();
      await page.waitForTimeout(500);

      await page.getByRole("button", { name: "Enregistrer un paiement" }).click();
      await expect(
        page.getByRole("heading", { name: "Enregistrer un paiement" }),
      ).toBeVisible({ timeout: 10000 });

      await page.getByRole("button", { name: "Enregistrer le paiement" }).click();
      await expect(page.getByText("Paiement enregistré")).toBeVisible({
        timeout: 10000,
      });

      await expect(page.getByText("Payée")).toBeVisible({ timeout: 10000 });
    } finally {
      const user = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      if (user) {
        await prisma.user.delete({
          where: { id: user.id },
        });
      }
    }
  });
});
