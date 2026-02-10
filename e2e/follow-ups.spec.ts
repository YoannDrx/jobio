import { prisma } from "@/lib/prisma";
import { expect, test } from "@playwright/test";
import { createTestAccount } from "./utils/auth-test";

test.describe("follow-ups", () => {
  test("complete a follow-up from today view", async ({ page }) => {
    const userData = await createTestAccount({
      page,
      callbackURL: "/app",
    });

    // Create test data: mission + follow-up for today
    const user = await prisma.user.findUniqueOrThrow({
      where: { email: userData.email },
    });
    const mission = await prisma.mission.create({
      data: {
        title: "Mission Follow-up Test",
        company: "FollowCorp",
        status: "A_POSTULER",
        userId: user.id,
      },
    });

    const now = new Date();
    await prisma.followUp.create({
      data: {
        title: "Relancer recruteur",
        type: "EMAIL",
        scheduledAt: now,
        missionId: mission.id,
        userId: user.id,
      },
    });

    // Navigate to Today (dashboard)
    await page.goto("/app");
    await page.waitForLoadState("networkidle");

    // Verify the follow-up appears
    await expect(page.getByText("Relancer recruteur")).toBeVisible({
      timeout: 10000,
    });

    // Clean up
    await prisma.followUp.deleteMany({ where: { userId: user.id } });
    await prisma.mission.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
  });
});
