import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { faker } from "@faker-js/faker";
import type { Page } from "@playwright/test";
import { retry } from "./retry";

export const getUserEmail = () =>
  `playwright-test-${faker.internet.email().toLowerCase()}`;

/**
 * Helper function to create a test account
 * @returns Object containing the test user's credentials
 */
export async function createTestAccount(options: {
  page: Page;
  callbackURL?: string;
  initialUserData?: { name: string; email: string; password: string };
  admin?: boolean;
}) {
  // Generate fake user data
  const userData = options.initialUserData ?? {
    name: faker.person.fullName(),
    email: getUserEmail(),
    password: faker.internet.password({ length: 12, memorable: true }),
  };

  // Navigate to signup page
  await options.page.goto(`/auth/signup?callbackUrl=${options.callbackURL}`);

  // Fill out the form
  await options.page.getByLabel("Name").fill(userData.name);
  await options.page.getByLabel("Email").fill(userData.email);
  await options.page.locator('input[name="password"]').fill(userData.password);
  await options.page
    .locator('input[name="verifyPassword"]')
    .fill(userData.password);

  // Submit the form
  await options.page.getByRole("button", { name: /sign up/i }).click();

  // Wait for navigation to complete - we should be redirected to the callback URL
  if (options.callbackURL) {
    await options.page.waitForURL(
      (url) => url.pathname === options.callbackURL,
      {
        timeout: 30000,
      },
    );
    await options.page.waitForLoadState("networkidle");
  }

  const user = await retry(
    async () =>
      prisma.user.findUniqueOrThrow({
        where: { email: userData.email },
      }),
    {
      maxAttempts: 5,
      delayMs: 1000,
      backoff: true,
    },
  );

  if (options.admin) {
    logger.info("Creating admin user", user);
    await prisma.user.update({
      where: { id: user.id },
      data: { role: "admin" },
    });
    // await 5 seconds
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  return userData;
}

/**
 * Helper function to sign in with an existing account
 * @returns Object containing the user's credentials
 */
export async function signInAccount(options: {
  page: Page;
  userData: { email: string; password: string };
  callbackURL?: string;
}) {
  const { page, userData, callbackURL } = options;

  // Navigate to signin page
  await page.goto(
    `/auth/signin${callbackURL ? `?callbackUrl=${callbackURL}` : ""}`,
  );

  // Fill out the form
  await page.getByLabel("Email").fill(userData.email);
  await page.locator('input[name="password"]').fill(userData.password);

  // Submit the form
  await page
    .getByRole("button", { name: /sign in/i })
    .first()
    .click();

  // Wait for navigation to complete if a callback URL is provided
  if (callbackURL) {
    try {
      await page.waitForURL((url) => url.pathname === callbackURL, {
        timeout: 30000,
      });
      await page.waitForLoadState("networkidle");
    } catch (error) {
      logger.error("Error waiting for navigation to complete", error);
    }
  }

  return userData;
}

/**
 * Helper function to sign out the current user
 * @param page - Playwright page object
 */
export async function signOutAccount(options: { page: Page }) {
  const { page } = options;

  try {
    // Navigate to account page so the user dropdown is always available.
    await page.goto(`/account`);
    await page.waitForLoadState("networkidle");

    // Dismiss potential overlays that can intercept pointer events in CI.
    await page.keyboard.press("Escape").catch(() => undefined);

    const sidebarUserButton = page.getByTestId("sidebar-user-button");
    await sidebarUserButton.waitFor({ state: "visible", timeout: 10000 });
    await sidebarUserButton.click({ force: true });

    const logoutMenuItem = page.getByRole("menuitem", {
      name: /logout|log out|se déconnecter|deconnexion|déconnexion/i,
    });
    await logoutMenuItem.waitFor({ state: "visible", timeout: 10000 });
    await logoutMenuItem.click({ force: true });

    await page.waitForURL(
      (url) => url.pathname === "/auth/signin" || url.pathname === "/",
      {
        timeout: 15000,
      },
    );

    if (page.url().endsWith("/")) {
      await page.goto("/auth/signin");
    }

    await page.waitForURL((url) => url.pathname === "/auth/signin", {
      timeout: 15000,
    });
  } catch (error) {
    logger.warn("UI sign-out failed, falling back to cookie reset", error);

    // Keep tests deterministic even if UI overlays interfere.
    await page.context().clearCookies();
    await page.goto("/auth/signin");
    await page.waitForURL((url) => url.pathname === "/auth/signin", {
      timeout: 10000,
    });
  }
}
