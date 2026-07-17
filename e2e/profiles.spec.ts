import { prisma } from "@/lib/prisma";
import { test } from "@playwright/test";
import { createTestAccount } from "./utils/auth-test";

test.describe("profiles", () => {
  test("redirects hidden profile deep links to the V1 today page", async ({
    page,
  }) => {
    const userData = await createTestAccount({
      page,
      callbackURL: "/job",
    });

    await page.goto("/job/profiles");
    await page.waitForURL(
      (url) =>
        url.pathname === "/job" &&
        url.searchParams.get("notice") === "feature-unavailable",
      { timeout: 15000 },
    );

    const user = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (user) {
      await prisma.user.delete({ where: { id: user.id } });
    }
  });
});
