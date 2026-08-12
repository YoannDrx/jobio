import { prisma } from "@/lib/prisma";
import { expect, test } from "@playwright/test";
import { createTestAccount } from "./utils/auth-test";

test.describe("sequences", () => {
  test("opens the public sequences module", async ({ page }) => {
    const userData = await createTestAccount({
      page,
      callbackURL: "/job",
    });

    await page.goto("/job/sequences");
    await expect(page).toHaveURL(/\/job\/sequences/);
    await expect(
      page.getByRole("heading", { name: /^Séquences/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Nouvelle séquence" }),
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
});
