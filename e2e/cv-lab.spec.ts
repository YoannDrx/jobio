import { prisma } from "@/lib/prisma";
import { expect, test } from "@playwright/test";
import { createTestAccount } from "./utils/auth-test";

test.describe("cv-lab", () => {
  test("archive and restore a cv document", async ({ page }) => {
    const userData = await createTestAccount({
      page,
      callbackURL: "/job",
    });

    try {
      const user = await prisma.user.findUnique({
        where: { email: userData.email },
      });
      expect(user).not.toBeNull();

      if (!user) {
        throw new Error("User not found after signup");
      }

      const profile = await prisma.userProfile.create({
        data: {
          userId: user.id,
          name: "Profil CV Lab",
          headline: "Product Engineer",
        },
      });

      await prisma.cvLabDocument.create({
        data: {
          userId: user.id,
          profileId: profile.id,
          name: "CV test e2e",
          targetRole: "Product Engineer",
          template: "CLASSIC",
          theme: "MODERN",
          pageSize: "A4",
          accentColor: "#0f172a",
          fontFamily: "Inter",
          sectionOrder: [
            "summary",
            "experiences",
            "skills",
            "projects",
            "education",
            "languages",
            "certifications",
          ],
          hiddenSections: [],
        },
      });

      await page.goto("/job/cv-lab");
      await page.waitForLoadState("networkidle");

      await expect(page.getByRole("button", { name: "Archiver" })).toBeVisible({
        timeout: 10000,
      });
      await expect(page.getByText("A4 (verrouillé)")).toBeVisible({
        timeout: 10000,
      });
      await expect(
        page.getByRole("button", { name: "Export JSON" }),
      ).toBeVisible({
        timeout: 10000,
      });
      await expect(
        page.getByRole("button", { name: "Import JSON" }),
      ).toBeVisible({
        timeout: 10000,
      });

      await page.getByRole("button", { name: "Archiver" }).click();
      await expect(page.getByText("CV archivé")).toBeVisible({
        timeout: 10000,
      });

      await page.getByTestId("cv-lab-view-filter-trigger").click();
      await page.getByRole("option", { name: "Archivés" }).click();
      await expect(page.getByText(/^Archivé$/)).toBeVisible({ timeout: 10000 });

      await page.getByRole("button", { name: "Restaurer" }).click();
      await expect(page.getByText("CV restauré")).toBeVisible({
        timeout: 10000,
      });

      await page.getByTestId("cv-lab-view-filter-trigger").click();
      await page.getByRole("option", { name: "Actifs" }).click();
      await expect(page.getByRole("button", { name: "Archiver" })).toBeVisible({
        timeout: 10000,
      });
    } finally {
      const user = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      if (user) {
        await prisma.user.delete({
          where: { id: user.id },
        });
      }
    }
  });

  test("preview updates from unsaved draft changes", async ({ page }) => {
    const userData = await createTestAccount({
      page,
      callbackURL: "/job",
    });

    try {
      const user = await prisma.user.findUnique({
        where: { email: userData.email },
      });
      expect(user).not.toBeNull();

      if (!user) {
        throw new Error("User not found after signup");
      }

      const profile = await prisma.userProfile.create({
        data: {
          userId: user.id,
          name: "Profil CV Live",
          headline: "Frontend Engineer",
        },
      });

      const document = await prisma.cvLabDocument.create({
        data: {
          userId: user.id,
          profileId: profile.id,
          name: "CV initial",
          targetRole: "Frontend Engineer",
          template: "CLASSIC",
          theme: "MODERN",
          pageSize: "A4",
          accentColor: "#0f172a",
          fontFamily: "Inter",
          sectionOrder: [
            "summary",
            "experiences",
            "skills",
            "projects",
            "education",
            "languages",
            "certifications",
          ],
          hiddenSections: [],
        },
      });

      await page.goto("/job/cv-lab");
      await page.waitForLoadState("networkidle");

      const cvNameInput = page.getByLabel("Nom du CV");
      await expect(cvNameInput).toBeVisible({ timeout: 10000 });
      await expect(cvNameInput).toHaveValue("CV initial");

      await cvNameInput.fill("CV brouillon live");
      await expect(
        page.getByRole("button", { name: "Réinitialiser brouillon" }),
      ).toBeVisible({
        timeout: 10000,
      });

      const previewFrame = page.frameLocator('iframe[title="cv-preview"]');
      await expect(
        previewFrame.getByText(/CV\s+CV brouillon live/i),
      ).toBeVisible({
        timeout: 10000,
      });

      const persistedDocument = await prisma.cvLabDocument.findUnique({
        where: {
          id: document.id,
        },
        select: {
          name: true,
        },
      });

      expect(persistedDocument?.name).toBe("CV initial");
    } finally {
      const user = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      if (user) {
        await prisma.user.delete({
          where: { id: user.id },
        });
      }
    }
  });

  test("restore local draft after page reload", async ({ page }) => {
    const userData = await createTestAccount({
      page,
      callbackURL: "/job",
    });

    try {
      const user = await prisma.user.findUnique({
        where: { email: userData.email },
      });
      expect(user).not.toBeNull();

      if (!user) {
        throw new Error("User not found after signup");
      }

      const profile = await prisma.userProfile.create({
        data: {
          userId: user.id,
          name: "Profil CV Recovery",
          headline: "Software Engineer",
        },
      });

      await prisma.cvLabDocument.create({
        data: {
          userId: user.id,
          profileId: profile.id,
          name: "CV recovery",
          targetRole: "Software Engineer",
          template: "CLASSIC",
          theme: "MODERN",
          pageSize: "A4",
          accentColor: "#0f172a",
          fontFamily: "Inter",
          sectionOrder: [
            "summary",
            "experiences",
            "skills",
            "projects",
            "education",
            "languages",
            "certifications",
          ],
          hiddenSections: [],
        },
      });

      await page.goto("/job/cv-lab");
      await page.waitForLoadState("networkidle");

      const cvNameInput = page.getByLabel("Nom du CV");
      await expect(cvNameInput).toHaveValue("CV recovery");
      await cvNameInput.fill("CV recovery draft local");

      await page.waitForTimeout(900);
      await page.reload();
      await page.waitForLoadState("networkidle");

      await expect(page.getByTestId("cv-lab-local-recovery-card")).toBeVisible({
        timeout: 10000,
      });
      await page
        .getByRole("button", { name: "Restaurer le brouillon local" })
        .click();
      await expect(page.getByLabel("Nom du CV")).toHaveValue(
        "CV recovery draft local",
        {
          timeout: 10000,
        },
      );
    } finally {
      const user = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      if (user) {
        await prisma.user.delete({
          where: { id: user.id },
        });
      }
    }
  });

  test("compare two CV versions in studio", async ({ page }) => {
    const userData = await createTestAccount({
      page,
      callbackURL: "/job",
    });

    try {
      const user = await prisma.user.findUnique({
        where: { email: userData.email },
      });
      expect(user).not.toBeNull();

      if (!user) {
        throw new Error("User not found after signup");
      }

      const profile = await prisma.userProfile.create({
        data: {
          userId: user.id,
          name: "Profil CV Compare",
          headline: "Platform Engineer",
        },
      });

      const document = await prisma.cvLabDocument.create({
        data: {
          userId: user.id,
          profileId: profile.id,
          name: "CV compare",
          targetRole: "Platform Engineer",
          template: "CLASSIC",
          theme: "MODERN",
          pageSize: "A4",
          accentColor: "#0f172a",
          fontFamily: "Inter",
          sectionOrder: [
            "summary",
            "experiences",
            "skills",
            "projects",
            "education",
            "languages",
            "certifications",
          ],
          hiddenSections: [],
        },
      });

      const baseSnapshot = {
        profileId: profile.id,
        name: "CV compare v1",
        targetRole: "Platform Engineer",
        template: "CLASSIC",
        theme: "MODERN",
        pageSize: "A4",
        accentColor: "#0f172a",
        fontFamily: "Inter",
        headlineOverride: null,
        summaryOverride: null,
        sectionOrder: [
          "summary",
          "experiences",
          "skills",
          "projects",
          "education",
          "languages",
          "certifications",
        ],
        hiddenSections: [],
      } as const;

      const nextSnapshot = {
        ...baseSnapshot,
        name: "CV compare v2",
        targetRole: "Senior Platform Engineer",
      } as const;

      await prisma.cvLabDocumentVersion.createMany({
        data: [
          {
            documentId: document.id,
            userId: user.id,
            label: "Version v2",
            snapshot: nextSnapshot,
          },
          {
            documentId: document.id,
            userId: user.id,
            label: "Version v1",
            snapshot: baseSnapshot,
          },
        ],
      });

      await page.goto("/job/cv-lab");
      await page.waitForLoadState("networkidle");

      await expect(page.getByText("Comparateur de versions")).toBeVisible({
        timeout: 10000,
      });

      await page.getByTestId("cv-lab-version-compare-left").click();
      await page.getByRole("option", { name: "Version v1" }).click();

      await page.getByTestId("cv-lab-version-compare-right").click();
      await page.getByRole("option", { name: "Version v2" }).click();

      const nameDiffItem = page.getByTestId("cv-lab-version-diff-name");
      await expect(nameDiffItem).toBeVisible({ timeout: 10000 });
      await expect(nameDiffItem.getByText("CV compare v1")).toBeVisible({
        timeout: 10000,
      });
      await expect(nameDiffItem.getByText("CV compare v2")).toBeVisible({
        timeout: 10000,
      });
    } finally {
      const user = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      if (user) {
        await prisma.user.delete({
          where: { id: user.id },
        });
      }
    }
  });

  test("preview and apply ATS suggestions to draft", async ({ page }) => {
    const userData = await createTestAccount({
      page,
      callbackURL: "/job",
    });

    try {
      const user = await prisma.user.findUnique({
        where: { email: userData.email },
      });
      expect(user).not.toBeNull();

      if (!user) {
        throw new Error("User not found after signup");
      }

      const profile = await prisma.userProfile.create({
        data: {
          userId: user.id,
          name: "Profil CV ATS",
          headline: "Engineer",
          bio: "Developpeur fullstack produit.",
          experiences: [],
          skills: [],
        },
      });

      await prisma.cvLabDocument.create({
        data: {
          userId: user.id,
          profileId: profile.id,
          name: "CV ATS",
          targetRole: null,
          template: "CLASSIC",
          theme: "MODERN",
          pageSize: "A4",
          accentColor: "#0f172a",
          fontFamily: "Inter",
          summaryOverride: "",
          sectionOrder: [
            "summary",
            "experiences",
            "skills",
            "projects",
            "education",
            "languages",
            "certifications",
          ],
          hiddenSections: ["summary", "skills"],
        },
      });

      await page.goto("/job/cv-lab");
      await page.waitForLoadState("networkidle");

      await page
        .getByLabel("Fiche de poste (optionnel, recommande)")
        .fill(
          "Nous recherchons un Senior React TypeScript Engineer avec experience Node.js et optimisation de performance.",
        );

      await page.getByRole("button", { name: "Lancer l'analyse ATS" }).click();
      await expect(page.getByTestId("cv-lab-ats-preview-button")).toBeVisible({
        timeout: 10000,
      });

      await page.getByTestId("cv-lab-ats-preview-button").click();
      await expect(
        page.getByTestId("cv-lab-ats-suggestion-preview"),
      ).toBeVisible({
        timeout: 10000,
      });

      await page.getByTestId("cv-lab-ats-apply-button").click();
      await expect(page.getByLabel("Résumé personnalisé")).toContainText(
        "Impact chiffré à compléter",
        {
          timeout: 10000,
        },
      );
    } finally {
      const user = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      if (user) {
        await prisma.user.delete({
          where: { id: user.id },
        });
      }
    }
  });
});
