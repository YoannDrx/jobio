import { prisma } from "@/lib/prisma";
import { expect, test } from "@playwright/test";
import { createTestAccount } from "./utils/auth-test";

test.describe("contacts", () => {
  test("create and view a contact", async ({ page }) => {
    const userData = await createTestAccount({
      page,
      callbackURL: "/app",
    });

    // Navigate to contacts page
    await page.goto("/app/contacts");
    await page.waitForLoadState("networkidle");

    // Click on create contact button
    await page.getByRole("button", { name: "Nouveau contact" }).click();

    // Fill the contact form
    await page.getByLabel(/prénom/i).fill("Jean");
    await page.getByLabel(/^nom/i).fill("Dupont");
    await page.getByLabel(/email/i).fill("jean.dupont@example.com");
    await page.getByLabel(/entreprise|société/i).fill("TechCorp");

    // Submit
    await page.getByRole("button", { name: /créer le contact/i }).click();
    await expect(page.getByText("Contact cree avec succes")).toBeVisible({
      timeout: 10000,
    });

    // Verify contact appears
    await expect(page.getByText("Jean Dupont")).toBeVisible({ timeout: 10000 });

    // Clean up
    const user = await prisma.user.findUnique({
      where: { email: userData.email },
    });
    if (user) {
      await prisma.contact.deleteMany({ where: { userId: user.id } });
      await prisma.user.delete({ where: { id: user.id } });
    }
  });
});
