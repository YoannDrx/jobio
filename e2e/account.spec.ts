import { prisma } from "@/lib/prisma";
import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import {
  createTestAccount,
  signInAccount,
  signOutAccount,
} from "./utils/auth-test";

test.describe("account", () => {
  test("delete account flow", async ({ page }) => {
    const userData = await createTestAccount({
      page,
      callbackURL: "/account",
    });

    await page.goto("/account/danger");
    await page.waitForURL(/\/account\/danger/, { timeout: 15000 });
    await page.getByRole("button", { name: /^Supprimer$/ }).click();

    const deleteDialog = page.getByRole("alertdialog", {
      name: "Supprimer ton compte ?",
    });
    await expect(deleteDialog).toBeVisible();
    await deleteDialog.getByRole("button", { name: /cancel/i }).click();
    await expect(deleteDialog).not.toBeVisible();

    const user = await prisma.user.findUnique({
      where: {
        email: userData.email,
      },
    });
    if (user) {
      await prisma.user.delete({
        where: { id: user.id },
      });
    }
  });

  test("update name flow", async ({ page }) => {
    const userData = await createTestAccount({
      page,
      callbackURL: "/account",
    });

    const input = page.getByRole("textbox", { name: "Nom" });
    await input.waitFor({ timeout: 10000 });

    const newName = faker.person.fullName();

    // Select all text then type to replace - reliable with React controlled inputs
    await input.click();
    await input.selectText();
    await input.pressSequentially(newName, { delay: 30 });

    // Verify the input value was set correctly before saving
    await expect(input).toHaveValue(newName, { timeout: 5000 });

    await page.getByRole("button", { name: /enregistrer/i }).click();

    await expect(page.getByText("Profil mis à jour")).toBeVisible({
      timeout: 10000,
    });

    // Verify the name was persisted in the database
    // (cookie cache prevents immediate UI verification after reload)
    const user = await prisma.user.findUnique({
      where: { email: userData.email },
    });
    expect(user?.name).toBe(newName);
    if (user) {
      await prisma.user.delete({
        where: { id: user.id },
      });
    }
  });

  test("change password flow", async ({ page }) => {
    const userData = await createTestAccount({ page, callbackURL: "/account" });

    await page.goto("/account/change-password");
    await page.waitForURL(/\/account\/change-password/, { timeout: 15000 });

    const newPassword = faker.internet.password({
      length: 12,
      memorable: true,
    });
    await page.locator('input[name="currentPassword"]').fill(userData.password);
    await page.locator('input[name="newPassword"]').fill(newPassword);
    await page.locator('input[name="confirmPassword"]').fill(newPassword);
    await page
      .getByRole("button", { name: /changer le mot de passe/i })
      .click();

    await expect(
      page.getByText("Mot de passe modifié avec succès"),
    ).toBeVisible({ timeout: 15000 });

    await signOutAccount({ page });

    await signInAccount({
      page,
      userData: {
        email: userData.email,
        password: newPassword,
      },
      callbackURL: "/job",
    });

    await page.waitForURL(/\/job/, { timeout: 30000 });

    const user = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (user) {
      await prisma.user.delete({
        where: { id: user.id },
      });
    }
  });
});
