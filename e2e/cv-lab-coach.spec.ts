import { prisma } from "@/lib/prisma";
import { expect, test } from "@playwright/test";
import { createTestAccount } from "./utils/auth-test";

test.describe("cv-lab-coach", () => {
  test("cv coach creates session and sends message", async ({ page }) => {
    const userData = await createTestAccount({
      page,
      callbackURL: "/app",
    });

    try {
      const user = await prisma.user.findUnique({
        where: { email: userData.email },
      });
      expect(user).not.toBeNull();

      if (!user) {
        throw new Error("User not found after signup");
      }

      await prisma.userProfile.create({
        data: {
          userId: user.id,
          name: "Profil CV Coach",
          headline: "Software Engineer",
        },
      });

      await page.goto("/app/cv-lab/coach");
      await page.waitForLoadState("networkidle");

      await expect(
        page.getByRole("button", { name: "Nouvelle session" }),
      ).toBeVisible({
        timeout: 10000,
      });

      await page.getByRole("button", { name: "Nouvelle session" }).click();

      await expect(page.getByText("Nouvelle session créée")).toBeVisible({
        timeout: 10000,
      });

      const messageInput = page.getByPlaceholder(
        "Raconte ton parcours, le coach structure tout...",
      );
      await expect(messageInput).toBeVisible({ timeout: 10000 });

      await messageInput.fill(
        "Je suis développeur web avec 5 ans d'expérience en React et TypeScript.",
      );
      await page.getByRole("button", { name: "Envoyer" }).click();

      await expect(page.getByText("Le coach rédige...")).toBeVisible({
        timeout: 10000,
      });

      await expect(page.getByText("Extraction des données...")).toBeVisible({
        timeout: 30000,
      });

      await expect(page.getByText("Développeur web")).toBeVisible({
        timeout: 30000,
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

  test("cv coach imports text and triggers analysis", async ({ page }) => {
    const userData = await createTestAccount({
      page,
      callbackURL: "/app",
    });

    try {
      const user = await prisma.user.findUnique({
        where: { email: userData.email },
      });
      expect(user).not.toBeNull();

      if (!user) {
        throw new Error("User not found after signup");
      }

      await prisma.userProfile.create({
        data: {
          userId: user.id,
          name: "Profil Import",
          headline: "Developer",
        },
      });

      const session = await prisma.cvLabCoachSession.create({
        data: {
          userId: user.id,
          name: "Session Import Test",
          status: "ACTIVE",
          structuredSnapshot: {
            identity: {
              fullName: "",
              headline: "",
              targetRole: "",
              location: "",
              email: "",
              phone: "",
              website: "",
              linkedinUrl: "",
            },
            summary: "",
            experiences: [],
            education: [],
            skills: { hard: [], soft: [], tools: [] },
            projects: [],
            languages: [],
            certifications: [],
            constraints: {
              availability: "",
              tjmTarget: "",
              salaryTarget: "",
              contractType: "",
              workMode: "",
              mobility: "",
            },
          },
          missingItems: [],
          inconsistencies: [],
          nextQuestions: [],
          completenessScore: 0,
        },
      });

      await page.goto("/app/cv-lab/coach");
      await page.waitForLoadState("networkidle");

      await page.getByRole("button", { name: "Importer un CV" }).click();

      const importTextarea = page.getByPlaceholder(
        "Colle le contenu de ton CV ici...",
      );
      await expect(importTextarea).toBeVisible({ timeout: 10000 });

      await importTextarea.fill(
        "EXPERIENCE PROFESSIONNELLE\n" +
          "Développeur Full Stack - TechCorp (2020-2024)\n" +
          "- Développement d'applications React et Node.js\n" +
          "- Optimisation des performances\n\n" +
          "FORMATION\n" +
          "Master Informatique - Université Paris (2018-2020)",
      );

      await page.getByRole("button", { name: "Importer et analyser" }).click();

      await expect(page.getByText("Extraction des données...")).toBeVisible({
        timeout: 30000,
      });

      const sessionAfter = await prisma.cvLabCoachSession.findUnique({
        where: { id: session.id },
        include: { messages: true },
      });

      expect(
        (sessionAfter as typeof sessionAfter & { messages: unknown[] }).messages
          .length,
      ).toBeGreaterThan(0);
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

  test("cv coach snapshot editor persists edits", async ({ page }) => {
    const userData = await createTestAccount({
      page,
      callbackURL: "/app",
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
          name: "Profil Editor",
          headline: "Engineer",
        },
      });

      const session = await prisma.cvLabCoachSession.create({
        data: {
          userId: user.id,
          name: "Session Editor Test",
          status: "ACTIVE",
          profileId: profile.id,
          structuredSnapshot: {
            identity: {
              fullName: "Jean Dupont",
              headline: "Développeur",
              targetRole: "",
              location: "Paris",
              email: "jean@example.com",
              phone: "",
              website: "",
              linkedinUrl: "",
            },
            summary: "",
            experiences: [],
            education: [],
            skills: { hard: [], soft: [], tools: [] },
            projects: [],
            languages: [],
            certifications: [],
            constraints: {
              availability: "",
              tjmTarget: "",
              salaryTarget: "",
              contractType: "",
              workMode: "",
              mobility: "",
            },
          },
          missingItems: [],
          inconsistencies: [],
          nextQuestions: [],
          completenessScore: 25,
        },
      });

      await page.goto("/app/cv-lab/coach");
      await page.waitForLoadState("networkidle");

      await expect(page.getByText("Session Editor Test")).toBeVisible({
        timeout: 10000,
      });

      const fullNameInput = page.getByLabel("Nom complet");
      await expect(fullNameInput).toHaveValue("Jean Dupont");

      await fullNameInput.fill("Jean Dupont Modifié");

      await page.getByRole("button", { name: "Sauvegarder" }).click();

      await expect(page.getByText("Dossier sauvegardé")).toBeVisible({
        timeout: 10000,
      });

      await page.reload();
      await page.waitForLoadState("networkidle");

      await expect(page.getByLabel("Nom complet")).toHaveValue(
        "Jean Dupont Modifié",
        {
          timeout: 10000,
        },
      );

      const sessionAfter = await prisma.cvLabCoachSession.findUnique({
        where: { id: session.id },
      });

      const snapshot = (
        sessionAfter as typeof sessionAfter & {
          structuredSnapshot: Record<string, unknown>;
        }
      ).structuredSnapshot;
      const identity = snapshot.identity as Record<string, string>;
      expect(identity.fullName).toBe("Jean Dupont Modifié");
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
