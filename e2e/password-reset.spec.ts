import { prisma } from "@/lib/prisma";
import { getServerUrl } from "@/lib/server-url";
import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { createTestAccount, signOutAccount } from "./utils/auth-test";

test("password reset flow", async ({ page }) => {
  // 1. Create a test account
  const userData = await createTestAccount({
    page,
    callbackURL: "/account",
  });

  // Wait to be on the account page
  // Wait 2 seconds to ensure everything is loaded

  await page.waitForURL((url) => url.pathname === "/account", {
    timeout: 10000,
  });

  // 2. Sign out
  await signOutAccount({ page });

  // 3. Go to forget password page
  await page.goto(`${getServerUrl()}/auth/forget-password`);

  // 4. Submit the email for password reset
  const sendResetButton = page.getByRole("button", {
    name: /envoyer le lien/i,
  });
  await expect(sendResetButton).toBeEnabled({ timeout: 10000 });
  await page.getByLabel("Email").fill(userData.email);
  await sendResetButton.click();

  // 5. Should be redirected to verify page
  await page.waitForURL((url) => url.pathname === "/auth/verify", {
    timeout: 10000,
  });

  const verification = await prisma.verification.findFirst({
    where: {
      identifier: {
        contains: "reset-password",
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const token = verification?.identifier.replace("reset-password:", "");

  expect(token).toBeTruthy();

  // 7. Navigate to the reset password page with the token
  const resetToken = token;
  await page.goto(`${getServerUrl()}/auth/reset-password?token=${resetToken}`);

  // 8. Set a new password
  const resetPasswordButton = page.getByRole("button", {
    name: /réinitialiser le mot de passe/i,
  });
  await expect(resetPasswordButton).toBeEnabled({ timeout: 10000 });
  const newPassword = faker.internet.password({ length: 12, memorable: true });
  await page.locator('input[name="password"]').fill(newPassword);
  await resetPasswordButton.click();

  // 9. Should be redirected to sign in page
  await page.waitForURL((url) => url.pathname === "/auth/signin", {
    timeout: 30000,
  });

  // 10. Try to sign in with the new password
  const signInForm = page.locator("form").filter({
    has: page.getByRole("button", { name: /se connecter/i }),
  });
  const signInButton = signInForm.getByRole("button", {
    name: /se connecter/i,
  });
  await expect(signInButton).toBeEnabled({ timeout: 10000 });
  await signInForm.getByLabel("Email").fill(userData.email);
  await signInForm.locator('input[name="password"]').fill(newPassword);
  await signInButton.click();

  // 11. Should be redirected to the app page
  await expect
    .poll(() => {
      const current = new URL(page.url());
      return current.pathname;
    })
    .toBe("/job");

  // Clean up - delete the test user
  const user = await prisma.user.findUnique({
    where: { email: userData.email },
  });

  if (user) {
    await prisma.user.delete({
      where: { id: user.id },
    });
  }
});
