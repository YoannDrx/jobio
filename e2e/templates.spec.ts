import { prisma } from "@/lib/prisma";
import { expect, test } from "@playwright/test";
import { createTestAccount } from "./utils/auth-test";

test.describe("templates", () => {
  test("view system templates", async ({ page }) => {
    const userData = await createTestAccount({
      page,
      callbackURL: "/app",
    });

    // Navigate to templates page
    await page.goto("/app/templates");
    await page.waitForLoadState("networkidle");

    // Verify system templates are visible (at least some of them)
    await expect(page.getByText(/candidature/i).first()).toBeVisible({
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
    await page
      .getByRole("button", { name: /nouveau template|créer|ajouter/i })
      .click();

    // Fill the template form
    await page.getByLabel(/nom|titre/i).fill("Mon template test");
    await page.getByLabel(/sujet|subject/i).fill("Re: {{mission}}");

    // Find the body/content textarea and fill it
    const bodyField = page.getByLabel(/contenu|corps|body/i).first();
    if (await bodyField.isVisible()) {
      await bodyField.fill(
        "Bonjour, je souhaite postuler pour la mission {{mission}}.",
      );
    }

    // Submit
    await page
      .getByRole("button", { name: /créer|sauvegarder|enregistrer/i })
      .click();
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
