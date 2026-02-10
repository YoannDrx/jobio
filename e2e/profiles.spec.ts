import { prisma } from "@/lib/prisma";
import { expect, test } from "@playwright/test";
import { createTestAccount } from "./utils/auth-test";

test.describe("profiles", () => {
  test("create and view a profile", async ({ page }) => {
    const userData = await createTestAccount({
      page,
      callbackURL: "/app",
    });

    // Navigate to profiles page
    await page.goto("/app/profiles");
    await page.waitForLoadState("networkidle");

    // Click on "Nouveau profil" or similar button
    await page
      .getByRole("button", { name: /nouveau profil|créer|ajouter/i })
      .click();

    // Fill the profile form
    await page.getByLabel(/titre|headline/i).fill("Développeur React Senior");
    await page.getByLabel(/tjm/i).fill("650");

    // Submit
    await page
      .getByRole("button", { name: /créer|sauvegarder|enregistrer/i })
      .click();
    await page.waitForLoadState("networkidle");

    // Verify profile appears
    await expect(page.getByText("Développeur React Senior")).toBeVisible({
      timeout: 10000,
    });

    // Clean up
    const user = await prisma.user.findUnique({
      where: { email: userData.email },
    });
    if (user) {
      await prisma.userProfile.deleteMany({ where: { userId: user.id } });
      await prisma.user.delete({ where: { id: user.id } });
    }
  });
});
