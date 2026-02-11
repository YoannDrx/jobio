import { prisma } from "@/lib/prisma";
import { expect, test } from "@playwright/test";
import { createTestAccount } from "./utils/auth-test";

test.describe("sequences", () => {
  test("navigate to sequences page", async ({ page }) => {
    const userData = await createTestAccount({
      page,
      callbackURL: "/app",
    });

    // Navigate to sequences page
    await page.goto("/app/sequences");
    await page.waitForLoadState("networkidle");

    // Verify we're on the sequences page
    await expect(
      page.getByRole("heading", { name: /séquences/i }),
    ).toBeVisible();

    // Clean up
    const user = await prisma.user.findUnique({
      where: { email: userData.email },
    });
    if (user) {
      await prisma.sequence.deleteMany({ where: { userId: user.id } });
      await prisma.user.delete({ where: { id: user.id } });
    }
  });

  test("create a sequence with 2 steps", async ({ page }) => {
    const userData = await createTestAccount({
      page,
      callbackURL: "/app",
    });

    // Navigate to sequences page
    await page.goto("/app/sequences");
    await page.waitForLoadState("networkidle");

    // Click on "Nouvelle séquence" button
    await page.getByRole("button", { name: /nouvelle séquence/i }).click();

    // Fill the sequence form
    await page.getByLabel(/nom/i).fill("Sequence Test E2E");
    await page.getByLabel(/description/i).fill("Sequence de test pour E2E");

    // Add first step
    await page.getByRole("button", { name: /ajouter une étape/i }).click();
    await page
      .getByLabel(/délai \(jours\)/i)
      .first()
      .fill("1");
    await page
      .getByLabel(/type d'action/i)
      .first()
      .selectOption("EMAIL");
    await page
      .getByLabel(/contenu|message/i)
      .first()
      .fill("Première relance");

    // Add second step
    await page.getByRole("button", { name: /ajouter une étape/i }).click();
    await page
      .getByLabel(/délai \(jours\)/i)
      .last()
      .fill("3");
    await page
      .getByLabel(/type d'action/i)
      .last()
      .selectOption("EMAIL");
    await page
      .getByLabel(/contenu|message/i)
      .last()
      .fill("Deuxième relance");

    // Submit the form
    await page.getByRole("button", { name: /créer la séquence/i }).click();

    // Wait for success toast
    await expect(page.getByText(/séquence créée avec succès/i)).toBeVisible({
      timeout: 10000,
    });

    // Verify sequence appears in list
    await expect(page.getByText("Sequence Test E2E")).toBeVisible({
      timeout: 10000,
    });

    // Clean up
    const user = await prisma.user.findUnique({
      where: { email: userData.email },
    });
    if (user) {
      await prisma.sequence.deleteMany({ where: { userId: user.id } });
      await prisma.user.delete({ where: { id: user.id } });
    }
  });

  test("edit a sequence name", async ({ page }) => {
    const userData = await createTestAccount({
      page,
      callbackURL: "/app",
    });

    // Create a sequence in database
    const user = await prisma.user.findUniqueOrThrow({
      where: { email: userData.email },
    });
    await prisma.sequence.create({
      data: {
        name: "Sequence Original",
        description: "Description originale",
        userId: user.id,
        steps: JSON.stringify([
          {
            delay: 1,
            type: "EMAIL",
            content: "First step",
          },
        ]),
      },
    });

    // Navigate to sequences page
    await page.goto("/app/sequences");
    await page.waitForLoadState("networkidle");

    // Click on the sequence to edit
    await page.getByText("Sequence Original").click();

    // Wait for edit dialog to appear
    await expect(
      page.getByRole("heading", { name: /modifier la séquence/i }),
    ).toBeVisible();

    // Clear the name field and enter new name
    const nameInput = page.getByLabel(/nom/i);
    await nameInput.clear();
    await nameInput.fill("Sequence Modifiée");

    // Submit the form
    await page.getByRole("button", { name: /modifier/i }).click();

    // Wait for success toast
    await expect(page.getByText(/séquence mise à jour/i)).toBeVisible({
      timeout: 10000,
    });

    // Verify updated sequence appears
    await expect(page.getByText("Sequence Modifiée")).toBeVisible({
      timeout: 10000,
    });

    // Clean up
    await prisma.sequence.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
  });

  test("delete a sequence", async ({ page }) => {
    const userData = await createTestAccount({
      page,
      callbackURL: "/app",
    });

    // Create a sequence in database
    const user = await prisma.user.findUniqueOrThrow({
      where: { email: userData.email },
    });
    await prisma.sequence.create({
      data: {
        name: "Sequence à supprimer",
        description: "Cette séquence sera supprimée",
        userId: user.id,
        steps: JSON.stringify([
          {
            delay: 1,
            type: "EMAIL",
            content: "Step",
          },
        ]),
      },
    });

    // Navigate to sequences page
    await page.goto("/app/sequences");
    await page.waitForLoadState("networkidle");

    // Verify sequence is visible
    await expect(page.getByText("Sequence à supprimer").first()).toBeVisible();

    // Find the delete button
    const deleteButton = page
      .getByRole("button", { name: /supprimer|delete/i })
      .first();

    await deleteButton.click();

    // Confirm deletion if there's a confirmation dialog
    const confirmButton = page
      .getByRole("button", { name: /confirmer|supprimer|oui/i })
      .last();

    if (await confirmButton.isVisible().catch(() => false)) {
      await confirmButton.click();
    }

    // Wait for success toast
    await expect(page.getByText(/séquence supprimée/i)).toBeVisible({
      timeout: 10000,
    });

    // Verify sequence no longer appears
    await expect(page.getByText("Sequence à supprimer")).toHaveCount(0);

    // Clean up
    await prisma.user.delete({ where: { id: user.id } });
  });

  test("display empty state when no sequences exist", async ({ page }) => {
    const userData = await createTestAccount({
      page,
      callbackURL: "/app",
    });

    // Navigate to sequences page
    await page.goto("/app/sequences");
    await page.waitForLoadState("networkidle");

    // Verify empty state is shown
    await expect(page.getByText(/aucune séquence/i)).toBeVisible();
    await expect(
      page.getByText(
        /créez votre première séquence de relance pour automatiser vos suivi/i,
      ),
    ).toBeVisible();

    // Verify the empty state button is available
    await expect(
      page.getByRole("button", { name: /créer une séquence/i }),
    ).toBeVisible();

    // Clean up
    const user = await prisma.user.findUnique({
      where: { email: userData.email },
    });
    if (user) {
      await prisma.user.delete({ where: { id: user.id } });
    }
  });
});
