import { prisma } from "@/lib/prisma";
import { expect, test } from "@playwright/test";
import { createTestAccount } from "./utils/auth-test";

test.describe("templates", () => {
  test("opens the public message templates module", async ({ page }) => {
    const userData = await createTestAccount({
      page,
      callbackURL: "/job",
    });

    await page.goto("/job/templates");
    await expect(page).toHaveURL(/\/job\/templates/);
    await expect(
      page.getByRole("heading", { name: "Templates" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Nouveau template" }),
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
