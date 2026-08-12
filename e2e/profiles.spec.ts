import { prisma } from "@/lib/prisma";
import { expect, test } from "@playwright/test";
import { createTestAccount } from "./utils/auth-test";

test.describe("profiles", () => {
  test("opens the public positioning module", async ({ page }) => {
    const userData = await createTestAccount({
      page,
      callbackURL: "/job",
    });

    await page.goto("/job/profiles");
    await expect(page).toHaveURL(/\/job\/profiles/);
    await expect(page.getByRole("heading", { name: "Profils" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Nouveau profil" }),
    ).toBeVisible();

    const user = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (user) {
      await prisma.user.delete({ where: { id: user.id } });
    }
  });
});
