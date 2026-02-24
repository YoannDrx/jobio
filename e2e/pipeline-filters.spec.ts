import { prisma } from "@/lib/prisma";
import { expect, test } from "@playwright/test";
import { createTestAccount } from "./utils/auth-test";

test.describe("pipeline-filters", () => {
  test("use advanced pipeline filters", async ({ page }) => {
    const userData = await createTestAccount({
      page,
      callbackURL: "/job",
    });

    try {
      const user = await prisma.user.findUniqueOrThrow({
        where: { email: userData.email },
      });

      // Create test missions with different properties
      await prisma.mission.createMany({
        data: [
          {
            title: "Mission Remote React",
            userId: user.id,
            status: "A_POSTULER",
            workType: "REMOTE",
            stack: ["React", "TypeScript"],
            score: 85,
          },
          {
            title: "Mission Onsite Java",
            userId: user.id,
            status: "A_POSTULER",
            workType: "ONSITE",
            stack: ["Java", "Spring"],
            score: 40,
          },
        ],
      });

      await page.goto("/job/pipeline?view=list");
      await page.waitForLoadState("networkidle");

      // Open filters
      await page.getByRole("button", { name: /filtres/i }).click();

      // Click on "Remote" work type filter
      await page.getByRole("button", { name: /remote/i }).click();

      // Wait for results to filter
      await page.waitForTimeout(1000);

      // Verify Remote mission is visible
      await expect(page.getByText("Mission Remote React").first()).toBeVisible({
        timeout: 10000,
      });

      // Reset filters
      await page.getByRole("button", { name: /reinitialiser/i }).click();

      // Both missions should be visible
      await expect(page.getByText("Mission Remote React").first()).toBeVisible({
        timeout: 10000,
      });
      await expect(page.getByText("Mission Onsite Java").first()).toBeVisible({
        timeout: 10000,
      });
    } finally {
      const user = await prisma.user.findUnique({
        where: { email: userData.email },
      });
      if (user) {
        await prisma.mission.deleteMany({ where: { userId: user.id } });
        await prisma.user.delete({ where: { id: user.id } });
      }
    }
  });
});
