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

  test("create a sequence with default steps", async ({ page }) => {
    const userData = await createTestAccount({
      page,
      callbackURL: "/app",
    });

    // Navigate to sequences page
    await page.goto("/app/sequences");
    await page.waitForLoadState("networkidle");

    // Click on "Nouvelle séquence" button
    await page.getByRole("button", { name: /nouvelle séquence/i }).click();

    // Fill the sequence form (3 steps are pre-filled by default)
    await page.getByLabel(/nom de la séquence/i).fill("Sequence Test E2E");
    await page.getByLabel(/description/i).fill("Sequence de test pour E2E");

    // Submit the form with the 3 pre-filled steps
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
        steps: [
          {
            delayDays: 1,
            type: "EMAIL",
            title: "First step",
          },
        ],
      },
    });

    // Navigate to sequences page
    await page.goto("/app/sequences");
    await page.waitForLoadState("networkidle");

    // Wait for sequence to appear
    await expect(page.getByText("Sequence Original")).toBeVisible({
      timeout: 10000,
    });

    // Click the edit (pencil) button for this sequence
    const sequenceCard = page
      .locator("[data-slot='card']")
      .filter({ hasText: "Sequence Original" });
    await sequenceCard.getByRole("button").first().click();

    // Wait for edit dialog to appear
    await expect(
      page.getByRole("heading", { name: /modifier la séquence/i }),
    ).toBeVisible({ timeout: 5000 });

    // Clear the name field and enter new name
    const nameInput = page.getByLabel(/nom de la séquence/i);
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
        steps: [
          {
            delayDays: 1,
            type: "EMAIL",
            title: "Step",
          },
        ],
      },
    });

    // Navigate to sequences page
    await page.goto("/app/sequences");
    await page.waitForLoadState("networkidle");

    // Verify sequence is visible
    await expect(page.getByText("Sequence à supprimer").first()).toBeVisible({
      timeout: 10000,
    });

    // Click the delete (trash) button - it's the second button in the card
    const sequenceCard = page
      .locator("[data-slot='card']")
      .filter({ hasText: "Sequence à supprimer" });
    await sequenceCard.getByRole("button").last().click();

    // Confirm deletion in the AlertDialog
    const confirmDialog = page.getByRole("alertdialog");
    await expect(confirmDialog).toBeVisible({ timeout: 5000 });
    await confirmDialog.getByRole("button", { name: /supprimer/i }).click();

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
    await expect(page.getByText(/aucune séquence/i)).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText(/automatiser tes relances/i)).toBeVisible();

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
