import { prisma } from "@/lib/prisma";
import { test } from "@playwright/test";
import { createTestAccount } from "./utils/auth-test";

test.describe("sequences", () => {
  test("redirects hidden sequence deep links to the V1 today page", async ({
    page,
  }) => {
    const userData = await createTestAccount({
      page,
      callbackURL: "/job",
    });

    await page.goto("/job/sequences");
    await page.waitForURL(
      (url) =>
        url.pathname === "/job" &&
        url.searchParams.get("notice") === "feature-unavailable",
      { timeout: 15000 },
    );

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
