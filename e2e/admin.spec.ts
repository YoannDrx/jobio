import { expect, test } from "@playwright/test";
import {
  createTestAccount,
  signInAccount,
  signOutAccount,
} from "./utils/auth-test";

test.describe("admin", () => {
  test("verify admin dashboard work", async ({ page }) => {
    const user = await createTestAccount({
      page,
      callbackURL: "/app",
      admin: true,
    });
    await signOutAccount({ page });
    await signInAccount({
      page,
      userData: {
        email: user.email,
        password: user.password,
      },
      callbackURL: "/admin",
    });

    // signInAccount already navigated to /admin via callbackURL
    await page.waitForURL(/\/admin/, { timeout: 15000 });
    await page.waitForLoadState("networkidle");

    await expect(
      page.getByRole("link", { name: /Gérer les utilisateurs/i }),
    ).toBeVisible({
      timeout: 10000,
    });

    await expect(
      page.getByRole("link", { name: /Voir les feedbacks/i }).first(),
    ).toBeVisible({ timeout: 10000 });

    await page.getByRole("link", { name: /Gérer les utilisateurs/i }).click();

    await expect(page).toHaveURL(/\/admin\/users/, { timeout: 10000 });

    await page.getByRole("link", { name: /Feedback|Feedbacks/i }).first().click();
    await expect(page).toHaveURL(/\/admin\/feedback/, { timeout: 10000 });
  });
});
