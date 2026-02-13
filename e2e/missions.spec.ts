import { prisma } from "@/lib/prisma";
import { expect, test } from "@playwright/test";
import { createTestAccount } from "./utils/auth-test";

test.describe("missions", () => {
  // Use a wider viewport for pipeline tests (Kanban board needs horizontal space)
  test.use({ viewport: { width: 1920, height: 1080 } });

  test("create a mission and verify it appears", async ({ page }) => {
    const userData = await createTestAccount({
      page,
      callbackURL: "/app",
    });

    // Navigate to pipeline
    await page.goto("/app/pipeline");
    await page.waitForLoadState("networkidle");

    // Click on add mission button
    await page
      .getByRole("button", { name: /ajouter/i })
      .first()
      .click();

    // Fill the mission form
    await page.getByLabel(/titre/i).fill("Mission Test E2E");
    await page.getByLabel(/entreprise/i).fill("TestCorp");
    await page.getByLabel(/tjm/i).fill("600");

    // Submit the form
    await page.getByRole("button", { name: /créer la mission/i }).click();

    // Wait for success
    await page.waitForLoadState("networkidle");

    // Verify the mission appears in the pipeline
    const missionText = page.getByText("Mission Test E2E").first();
    await missionText.scrollIntoViewIfNeeded();
    await expect(missionText).toBeVisible({
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

  test("open mission detail from pipeline", async ({ page }) => {
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

    // Scroll to and click on the mission to open detail
    const missionText = page.getByText("Mission Status Test").first();
    await missionText.scrollIntoViewIfNeeded();
    await missionText.click();

    const detailSheet = page.getByRole("dialog");
    await expect(detailSheet).toBeVisible();
    await expect(
      detailSheet.getByRole("heading", { name: "Mission Status Test" }),
    ).toBeVisible();
    await expect(detailSheet.getByText("StatusCorp")).toBeVisible();
    await expect(detailSheet.getByText(/a postuler|à postuler/i)).toBeVisible();

    // Cleanup
    await prisma.mission.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
  });

  test("show mission with EN_PAUSE status in pipeline", async ({ page }) => {
    const userData = await createTestAccount({
      page,
      callbackURL: "/app",
    });

    const user = await prisma.user.findUniqueOrThrow({
      where: { email: userData.email },
    });

    await prisma.mission.create({
      data: {
        title: "Mission Pause Test",
        company: "PauseCorp",
        status: "EN_PAUSE",
        userId: user.id,
      },
    });

    await page.goto("/app/pipeline");
    await page.waitForLoadState("networkidle");

    const missionText = page.getByText("Mission Pause Test").first();
    await missionText.scrollIntoViewIfNeeded();
    await expect(missionText).toBeVisible({
      timeout: 10000,
    });

    await prisma.mission.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
  });

  test("hide archived missions from default pipeline view", async ({
    page,
  }) => {
    const userData = await createTestAccount({
      page,
      callbackURL: "/app",
    });

    const user = await prisma.user.findUniqueOrThrow({
      where: { email: userData.email },
    });

    await prisma.mission.createMany({
      data: [
        {
          title: "Mission Active Visible",
          company: "VisibleCorp",
          status: "A_POSTULER",
          userId: user.id,
        },
        {
          title: "Mission Archivee Cachee",
          company: "HiddenCorp",
          status: "ARCHIVE",
          archivedAt: new Date(),
          userId: user.id,
        },
      ],
    });

    await page.goto("/app/pipeline");
    await page.waitForLoadState("networkidle");

    const activeText = page.getByText("Mission Active Visible").first();
    await activeText.scrollIntoViewIfNeeded();
    await expect(activeText).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText("Mission Archivee Cachee")).toHaveCount(0);

    await prisma.mission.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
  });

  test("block mission creation when active mission limit is reached", async ({
    page,
  }) => {
    const userData = await createTestAccount({
      page,
      callbackURL: "/app",
    });

    const user = await prisma.user.findUniqueOrThrow({
      where: { email: userData.email },
    });

    await prisma.mission.createMany({
      data: Array.from({ length: 15 }).map((_, index) => ({
        title: `Mission Limit ${index + 1}`,
        company: "LimitCorp",
        status: "A_POSTULER" as const,
        userId: user.id,
      })),
    });

    await page.goto("/app/pipeline");
    await page.waitForLoadState("networkidle");

    await expect(page.getByText(/limite atteinte/i).first()).toBeVisible({
      timeout: 10000,
    });

    await page
      .getByRole("button", { name: /ajouter/i })
      .first()
      .click();
    await page.getByLabel(/titre/i).fill("Mission Should Be Blocked");
    await page.getByLabel(/entreprise/i).fill("BlockedCorp");
    await page.getByRole("button", { name: /créer la mission/i }).click();

    await expect(page.getByText(/limite atteinte/i).first()).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText("Mission Should Be Blocked")).toHaveCount(0);

    await prisma.mission.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
  });

  test("allow mission creation when archived missions are out of active limit", async ({
    page,
  }) => {
    const userData = await createTestAccount({
      page,
      callbackURL: "/app",
    });

    const user = await prisma.user.findUniqueOrThrow({
      where: { email: userData.email },
    });

    await prisma.mission.createMany({
      data: [
        ...Array.from({ length: 14 }).map((_, index) => ({
          title: `Mission Active ${index + 1}`,
          company: "ActiveCorp",
          status: "A_POSTULER" as const,
          userId: user.id,
        })),
        {
          title: "Mission Archivee Hors Limite",
          company: "ArchiveCorp",
          status: "ARCHIVE" as const,
          archivedAt: new Date(),
          userId: user.id,
        },
      ],
    });

    await page.goto("/app/pipeline");
    await page.waitForLoadState("networkidle");

    await page
      .getByRole("button", { name: /ajouter/i })
      .first()
      .click();
    await page.getByLabel(/titre/i).fill("Mission Allowed By Archive");
    await page.getByLabel(/entreprise/i).fill("AllowedCorp");
    await page.getByRole("button", { name: /créer la mission/i }).click();

    const missionText = page.getByText("Mission Allowed By Archive").first();
    await missionText.scrollIntoViewIfNeeded();
    await expect(missionText).toBeVisible({
      timeout: 10000,
    });

    await prisma.mission.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
  });
});
