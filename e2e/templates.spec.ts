import { prisma } from "@/lib/prisma";
import { expect, test } from "@playwright/test";
import { createTestAccount } from "./utils/auth-test";

test.describe("templates", () => {
  test("view templates page", async ({ page }) => {
    const userData = await createTestAccount({
      page,
      callbackURL: "/app",
    });

    // Navigate to templates page
    await page.goto("/app/templates");
    await page.waitForLoadState("networkidle");

    // Verify page is loaded and user can create templates
    await expect(page.getByRole("heading", { name: "Templates" })).toBeVisible(
      {
        timeout: 10000,
      },
    );
    await expect(page.getByRole("button", { name: "Nouveau template" })).toBeVisible({
      timeout: 10000,
    });

    // Clean up
    const user = await prisma.user.findUnique({
      where: { email: userData.email },
    });
    if (user) {
      await prisma.user.delete({ where: { id: user.id } });
    }
  });

  test("create a custom template", async ({ page }) => {
    const userData = await createTestAccount({
      page,
      callbackURL: "/app",
    });

    // Navigate to templates page
    await page.goto("/app/templates");
    await page.waitForLoadState("networkidle");

    // Click on create template button
    await page.getByRole("button", { name: "Nouveau template" }).click();

    // Fill the template form
    await page.getByLabel(/nom|titre/i).fill("Mon template test");
    await page.getByLabel(/sujet|subject/i).fill("Re: {{mission}}");

    await page
      .getByLabel(/^contenu/i)
      .fill("Bonjour, je souhaite postuler pour la mission {{mission}}.");

    // Submit
    await page.getByRole("button", { name: /creer le template/i }).click();
    await page.waitForLoadState("networkidle");

    // Verify template appears
    await expect(page.getByText("Mon template test")).toBeVisible({
      timeout: 10000,
    });

    // Clean up
    const user = await prisma.user.findUnique({
      where: { email: userData.email },
    });
    if (user) {
      await prisma.messageTemplate.deleteMany({ where: { userId: user.id } });
      await prisma.user.delete({ where: { id: user.id } });
    }
  });
});
