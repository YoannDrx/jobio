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

    await page.getByRole("button", { name: "Nouveau profil" }).click();

    // Fill the profile form
    await page
      .getByLabel(/nom du profil/i)
      .fill("Développeur React Senior");
    await page
      .getByLabel(/titre professionnel/i)
      .fill("Développeur Frontend React");
    await page.getByLabel(/tjm/i).fill("650");

    // Submit
    await page.getByRole("button", { name: /créer le profil/i }).click();
    await expect(page.getByText("Profil créé avec succès")).toBeVisible({
      timeout: 10000,
    });

    const user = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    expect(user).not.toBeNull();
    if (!user) {
      throw new Error("User not found after signup");
    }
    const createdProfile = await prisma.userProfile.findFirst({
      where: { userId: user.id, name: "Développeur React Senior" },
    });
    expect(createdProfile).not.toBeNull();

    // Clean up
    await prisma.userProfile.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
  });
});
