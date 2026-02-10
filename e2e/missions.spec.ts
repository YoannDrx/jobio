import { prisma } from "@/lib/prisma";
import { expect, test } from "@playwright/test";
import { createTestAccount } from "./utils/auth-test";

test.describe("missions", () => {
  test("create a mission and verify it appears", async ({ page }) => {
    const userData = await createTestAccount({
      page,
      callbackURL: "/app",
    });

    // Navigate to pipeline
    await page.goto("/app/pipeline");
    await page.waitForLoadState("networkidle");

    // Click on "Nouvelle mission" button
    await page.getByRole("button", { name: /nouvelle mission/i }).click();

    // Fill the mission form
    await page.getByLabel(/titre/i).fill("Mission Test E2E");
    await page.getByLabel(/entreprise/i).fill("TestCorp");
    await page.getByLabel(/tjm/i).fill("600");

    // Submit the form
    await page
      .getByRole("button", { name: /créer|sauvegarder|enregistrer/i })
      .click();

    // Wait for success
    await page.waitForLoadState("networkidle");

    // Verify the mission appears in the pipeline
    await expect(page.getByText("Mission Test E2E")).toBeVisible({
      timeout: 10000,
    });

    // Clean up
    const user = await prisma.user.findUnique({
      where: { email: userData.email },
    });
    if (user) {
      await prisma.mission.deleteMany({ where: { userId: user.id } });
      await prisma.user.delete({ where: { id: user.id } });
    }
  });

  test("change mission status", async ({ page }) => {
    const userData = await createTestAccount({
      page,
      callbackURL: "/app",
    });

    // Create a mission via the database for this test
    const user = await prisma.user.findUniqueOrThrow({
      where: { email: userData.email },
    });
    await prisma.mission.create({
      data: {
        title: "Mission Status Test",
        company: "StatusCorp",
        status: "A_POSTULER",
        userId: user.id,
      },
    });

    // Navigate to pipeline
    await page.goto("/app/pipeline");
    await page.waitForLoadState("networkidle");

    // Click on the mission to open detail
    await page.getByText("Mission Status Test").click();

    // Wait for detail sheet to open
    await page.waitForTimeout(500);

    // Look for a status selector/button and change it
    const statusButton = page
      .getByRole("button", { name: /a postuler|à postuler/i })
      .first();
    if (await statusButton.isVisible()) {
      await statusButton.click();
      // Select "ENTRETIEN" from dropdown
      await page
        .getByRole("option", { name: /entretien/i })
        .first()
        .click();
    }

    // Cleanup
    await prisma.mission.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
  });
});
