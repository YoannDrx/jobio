import { expect, test } from "@playwright/test";
import {
  createTestAccount,
  signInAccount,
  signOutAccount,
} from "./utils/auth-test";

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

test.describe("admin", () => {
  test("verify admin dashboard work", async ({ page }) => {
    const user = await createTestAccount({
      page,
      callbackURL: "/job",
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

    await page
      .getByRole("link", { name: /Feedback|Feedbacks/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/admin\/feedback/, { timeout: 10000 });
  });

  test("open user detail and verify admin 360 cards", async ({ page }) => {
    const adminUser = await createTestAccount({
      page,
      callbackURL: "/job",
      admin: true,
    });

    await signOutAccount({ page });
    await signInAccount({
      page,
      userData: {
        email: adminUser.email,
        password: adminUser.password,
      },
      callbackURL: "/admin/users",
    });

    await page.waitForURL(/\/admin\/users/, { timeout: 15000 });
    await expect(
      page.getByRole("heading", { name: /Gestion utilisateurs/i }),
    ).toBeVisible({ timeout: 15000 });

    const userCellLink = page
      .getByRole("link", {
        name: new RegExp(escapeRegex(adminUser.email), "i"),
      })
      .first();
    await expect(userCellLink).toBeVisible({ timeout: 10000 });
    await userCellLink.click();

    await expect(page).toHaveURL(/\/admin\/users\/[^/]+$/, { timeout: 10000 });
    await expect(page.getByTestId("admin-user-operations-card")).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByTestId("admin-user-monitoring-card")).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText(/Historique crédits IA/i)).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText(/Timeline facturation/i)).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText(/Santé facturation/i)).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText(/Playbook support facturation/i)).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText(/Score de risque facturation/i)).toBeVisible({
      timeout: 10000,
    });
    await expect(
      page.getByRole("button", { name: /Export timeline CSV/i }),
    ).toBeVisible({
      timeout: 10000,
    });
    await expect(
      page.getByTestId("billing-timeline-source-filter"),
    ).toBeVisible({
      timeout: 10000,
    });
    await expect(
      page.getByTestId("billing-timeline-event-type-filter"),
    ).toBeVisible({
      timeout: 10000,
    });
    await expect(
      page.getByTestId("billing-timeline-export-filtered"),
    ).toBeVisible({
      timeout: 10000,
    });
    await expect(
      page.getByLabel(/Référence invoice\/subscription/i),
    ).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText(/Audit admin ciblé utilisateur/i)).toBeVisible({
      timeout: 10000,
    });
    await expect(
      page.getByLabel(/Rechercher \(action, acteur, metadata\)/i),
    ).toBeVisible({
      timeout: 10000,
    });
  });
});
