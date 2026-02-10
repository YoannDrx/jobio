import { prisma } from "@/lib/prisma";
import { getServerUrl } from "@/lib/server-url";
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

    const dangerLink = page.getByRole("link", { name: "Danger" });
    await dangerLink.waitFor({ timeout: 10000 });
    await dangerLink.click();
    await page.waitForURL(/\/account\/danger/, { timeout: 15000 });
    await page.getByRole("button", { name: "Delete" }).click();

    const deleteDialog = page.getByRole("alertdialog", {
      name: "Delete your account ?",
    });
    await expect(deleteDialog).toBeVisible();

    const confirmInput = deleteDialog.getByRole("textbox");
    await confirmInput.fill("Delete");

    const deleteButton = deleteDialog.getByRole("button", { name: /delete/i });
    await expect(deleteButton).toBeEnabled();
    await deleteButton.click();

    await expect(page.getByText("Your deletion has been asked.")).toBeVisible();

    const verification = await prisma.verification.findFirst({
      where: {
        identifier: {
          contains: "delete-account",
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const token = verification?.identifier.replace("delete-account-", "");
    expect(token).not.toBeNull();

    const resetToken = token;
    const confirmUrl = `${getServerUrl()}/auth/confirm-delete?token=${resetToken}&callbackUrl=/auth/goodbye`;
    await page.goto(confirmUrl);

    await page.getByRole("button", { name: "Yes, Delete My Account" }).click();
    await page.waitForURL(/\/auth\/goodbye/, { timeout: 10000 });
    await expect(page.getByText("Account Deleted").first()).toBeVisible();

    const user = await prisma.user.findUnique({
      where: {
        email: userData.email,
      },
    });

    expect(user).toBeNull();
  });

  test("update name flow", async ({ page }) => {
    const userData = await createTestAccount({
      page,
      callbackURL: "/account",
    });

    const input = page.getByRole("textbox", { name: "Name" });
    await input.waitFor({ timeout: 10000 });

    const newName = faker.person.fullName();

    // Select all text then type to replace - reliable with React controlled inputs
    await input.click();
    await input.selectText();
    await input.pressSequentially(newName, { delay: 30 });

    // Verify the input value was set correctly before saving
    await expect(input).toHaveValue(newName, { timeout: 5000 });

    // Wait for the API response to confirm the update
    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/api/auth/update-user") && response.ok(),
      { timeout: 15000 },
    );

    await page.getByRole("button", { name: /save/i }).click();

    await responsePromise;

    await expect(page.getByText("Profile updated")).toBeVisible({
      timeout: 10000,
    });

    // Verify the name was persisted in the database
    // (cookie cache prevents immediate UI verification after reload)
    const user = await prisma.user.findUnique({
      where: { email: userData.email },
    });
    expect(user?.name).toBe(newName);
  });

  test("change password flow", async ({ page }) => {
    const userData = await createTestAccount({ page, callbackURL: "/account" });

    await page.getByRole("link", { name: /change password/i }).click();

    const newPassword = faker.internet.password({
      length: 12,
      memorable: true,
    });
    await page.locator('input[name="currentPassword"]').fill(userData.password);
    await page.locator('input[name="newPassword"]').fill(newPassword);
    await page.locator('input[name="confirmPassword"]').fill(newPassword);
    await page.getByRole("button", { name: /Change Password/i }).click();

    await signOutAccount({ page });

    await signInAccount({
      page,
      userData: {
        email: userData.email,
        password: newPassword,
      },
      callbackURL: "/app",
    });

    await page.waitForURL(/\/app/, { timeout: 10000 });

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
