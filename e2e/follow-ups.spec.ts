import { prisma } from "@/lib/prisma";
import { expect, test } from "@playwright/test";
import { createTestAccount } from "./utils/auth-test";

test.describe("follow-ups", () => {
  test("complete a follow-up from today view", async ({ page }) => {
    const userData = await createTestAccount({
      page,
      callbackURL: "/job",
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
    const followUp = await prisma.followUp.create({
      data: {
        title: "Relancer recruteur",
        type: "EMAIL",
        scheduledAt: now,
        missionId: mission.id,
        userId: user.id,
      },
    });

    // Navigate to Today (dashboard)
    await page.goto("/job");
    await page.waitForLoadState("networkidle");

    // Verify the follow-up appears
    await expect(page.getByText("Relancer recruteur").first()).toBeVisible({
      timeout: 10000,
    });

    await page.getByRole("button", { name: "Compléter" }).first().click();
    await expect
      .poll(async () => {
        const updatedFollowUp = await prisma.followUp.findUnique({
          where: { id: followUp.id },
        });
        return updatedFollowUp?.completedAt !== null;
      })
      .toBe(true);

    // Clean up
    await prisma.followUp.deleteMany({ where: { userId: user.id } });
    await prisma.mission.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
  });
});
