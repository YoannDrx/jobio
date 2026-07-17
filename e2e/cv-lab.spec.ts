import { prisma } from "@/lib/prisma";
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { createTestAccount } from "./utils/auth-test";

const openCvEditor = async (page: Page) => {
  await page.goto("/job/cv-studio?tab=editor");
  await page.waitForLoadState("networkidle");

  const editButton = page.getByRole("button", { name: "Éditer", exact: true });
  if (await editButton.isVisible()) {
    await editButton.click();
  }

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible({ timeout: 10000 });
  await expect(
    page.getByRole("button", { name: "Fermer", exact: true }),
  ).toBeVisible({ timeout: 10000 });
  return dialog;
};

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

      const editor = await openCvEditor(page);

      await expect(
        editor.getByRole("button", { name: "Archiver" }),
      ).toBeVisible({
        timeout: 10000,
      });
      await expect(editor.getByText("A4 (verrouillé)")).toBeVisible({
        timeout: 10000,
      });
      await expect(
        editor.getByRole("button", { name: "Export JSON" }),
      ).toBeVisible({
        timeout: 10000,
      });
      await expect(
        editor.getByRole("button", { name: "Import JSON" }),
      ).toBeVisible({
        timeout: 10000,
      });

      await editor.getByRole("button", { name: "Archiver" }).click({
        force: true,
      });
      await expect(page.getByText("CV archivé")).toBeVisible({
        timeout: 10000,
      });

      await page.getByRole("button", { name: "Restaurer" }).click();
      await expect(page.getByText("CV restauré")).toBeVisible({
        timeout: 10000,
      });

      const restoredEditor = await openCvEditor(page);
      await expect(
        restoredEditor.getByRole("button", { name: "Archiver" }),
      ).toBeVisible({ timeout: 10000 });
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

      const editor = await openCvEditor(page);

      const targetRoleInput = editor.getByLabel("Poste ciblé");
      await expect(targetRoleInput).toBeVisible({ timeout: 10000 });
      await expect(targetRoleInput).toHaveValue("Frontend Engineer");

      await targetRoleInput.fill("Staff Frontend Engineer");
      await expect(
        editor.getByRole("button", { name: "Réinitialiser", exact: true }),
      ).toBeEnabled({
        timeout: 10000,
      });

      const previewFrame = page.frameLocator('iframe[title="cv-preview"]');
      await expect(
        previewFrame.getByText("Staff Frontend Engineer"),
      ).toBeVisible({
        timeout: 10000,
      });

      const persistedDocument = await prisma.cvLabDocument.findUnique({
        where: {
          id: document.id,
        },
        select: {
          targetRole: true,
        },
      });

      expect(persistedDocument?.targetRole).toBe("Frontend Engineer");
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

      const document = await prisma.cvLabDocument.create({
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

      const editor = await openCvEditor(page);

      const cvNameInput = editor.getByLabel("Nom du CV");
      await expect(cvNameInput).toHaveValue("CV recovery");
      await page.context().setOffline(true);
      await cvNameInput.fill("CV recovery draft local");

      const localDraftKey = `jobio.cv-lab.local-draft.v1:${document.id}`;
      await expect
        .poll(
          async () =>
            page.evaluate(
              (key) => window.localStorage.getItem(key),
              localDraftKey,
            ),
          { timeout: 5000 },
        )
        .toContain("CV recovery draft local");
      await page.context().setOffline(false);
      await page.reload();
      await page.waitForLoadState("networkidle");

      const reopenEditorButton = page.getByRole("button", {
        name: "Éditer",
        exact: true,
      });
      await expect(reopenEditorButton).toBeVisible({ timeout: 10000 });
      await reopenEditorButton.click();
      const reopenedEditor = page.getByRole("dialog");
      await expect(reopenedEditor).toBeVisible({ timeout: 10000 });

      await expect(
        reopenedEditor.getByTestId("cv-lab-local-recovery-card"),
      ).toBeVisible({ timeout: 10000 });

      await reopenedEditor
        .getByRole("button", { name: "Restaurer le brouillon local" })
        .click();
      await expect(reopenedEditor.getByLabel("Nom du CV")).toHaveValue(
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

      const editor = await openCvEditor(page);
      await editor.getByRole("tab", { name: "Versions" }).click();

      await expect(editor.getByText("Comparateur de versions")).toBeVisible({
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

      await prisma.subscription.create({
        data: {
          id: `sub_e2e_${user.id}`,
          referenceId: user.id,
          plan: "pro",
          status: "active",
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

      const editor = await openCvEditor(page);
      await editor.getByRole("tab", { name: "ATS" }).click();

      await editor
        .getByLabel("Fiche de poste (optionnel, recommande)")
        .fill(
          "Nous recherchons un Senior React TypeScript Engineer avec experience Node.js et optimisation de performance.",
        );

      await editor
        .getByRole("button", { name: "Lancer l'analyse ATS" })
        .click();
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
      await editor.getByRole("tab", { name: "Paramètres" }).click();
      await expect(editor.getByLabel("Résumé personnalisé")).toHaveValue(
        /Impact chiffré à compléter/,
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
