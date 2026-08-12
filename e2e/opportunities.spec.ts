import { prisma } from "@/lib/prisma";
import { expect, test } from "@playwright/test";
import { createTestAccount } from "./utils/auth-test";

test.describe("Radar Missions", () => {
  test("import an opportunity then explicitly convert it to a mission", async ({
    page,
  }) => {
    const userData = await createTestAccount({
      page,
      callbackURL: "/job/opportunities",
    });
    const user = await prisma.user.findUniqueOrThrow({
      where: { email: userData.email },
    });

    try {
      await page.goto("/job/opportunities");
      await page
        .getByPlaceholder("Titre puis contenu de l’annonce…")
        .fill(
          "Lead developer React E2E\nMission freelance de douze mois en remote avec TypeScript, React et Next.js.",
        );
      await page.getByRole("button", { name: "Analyser l’annonce" }).click();

      await expect(
        page.getByText("Annonce analysée et ajoutée au Radar"),
      ).toBeVisible({ timeout: 10_000 });
      await expect(
        page.getByRole("heading", { name: "Lead developer React E2E" }),
      ).toBeVisible({ timeout: 10_000 });

      await page.getByRole("button", { name: "Ajouter au pipeline" }).click();
      await expect(page.getByText("Mission ajoutée au pipeline")).toBeVisible({
        timeout: 10_000,
      });
      await expect(page.getByText("Dans le pipeline")).toBeVisible({
        timeout: 10_000,
      });

      await page.goto("/job/pipeline?view=list");
      await expect(
        page.getByText("Lead developer React E2E").first(),
      ).toBeVisible({
        timeout: 10_000,
      });
    } finally {
      await prisma.user.delete({ where: { id: user.id } });
    }
  });
});
