/* eslint-disable no-await-in-loop -- each viewport must reuse the authenticated page sequentially */
import AxeBuilder from "@axe-core/playwright";
import { prisma } from "@/lib/prisma";
import { expect, test } from "@playwright/test";
import { createTestAccount } from "./utils/auth-test";

const VIEWPORTS = [
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1280, height: 800 },
  { width: 1440, height: 900 },
] as const;

test.describe("Radar Missions accessibility", () => {
  test("has no critical accessibility or responsive regression", async ({
    page,
    browserName,
  }) => {
    // This scenario performs five full Axe scans across four viewport layouts.
    // It can legitimately exceed the shared E2E timeout on slower browsers/CI.
    test.slow();

    const userData = await createTestAccount({
      page,
      callbackURL: "/job/opportunities",
    });
    const user = await prisma.user.findUniqueOrThrow({
      where: { email: userData.email },
      select: { id: true },
    });

    try {
      for (const viewport of VIEWPORTS) {
        await page.setViewportSize(viewport);
        await page.goto("/job/opportunities");
        await expect(
          page.getByRole("heading", { name: "Radar Missions" }),
        ).toBeVisible();

        const documentWidth = await page.evaluate(() => ({
          viewport: window.innerWidth,
          scroll: document.documentElement.scrollWidth,
        }));
        expect(
          documentWidth.scroll,
          `document overflow at ${viewport.width}px`,
        ).toBeLessThanOrEqual(documentWidth.viewport + 1);

        const results = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
          .analyze();
        expect(
          results.violations,
          `axe violations at ${viewport.width}px`,
        ).toEqual([]);
      }

      await page.setViewportSize(VIEWPORTS[0]);
      await page
        .getByLabel("Contenu de l’annonce")
        .fill(
          "Développeur TypeScript accessible\nMission freelance React et Next.js entièrement remote.",
        );
      await page.getByRole("button", { name: "Analyser l’annonce" }).click();
      await expect(
        page.getByRole("heading", {
          name: "Développeur TypeScript accessible",
        }),
      ).toBeVisible();

      const populatedResults = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
      expect(populatedResults.violations).toEqual([]);

      // Safari on macOS uses Option+Tab unless Full Keyboard Access is enabled.
      await page.keyboard.press(browserName === "webkit" ? "Alt+Tab" : "Tab");
      const focusedElement = page.locator(":focus");
      await expect(focusedElement).toBeVisible();
      await expect
        .poll(async () => focusedElement.evaluate((element) => element.tagName))
        .not.toBe("BODY");
    } finally {
      await prisma.user.delete({ where: { id: user.id } });
    }
  });
});
