import { describe, expect, it } from "vitest";
import { computeMasterCvCompleteness } from "@/features/cv-lab/cv-completeness";

const makeFullCv = () => ({
  fullName: "Yoann Andrieux",
  headline: "Senior Frontend Engineer",
  summary: "Passionné par le développement web et les produits numériques.",
  email: "yoann@test.com",
  phone: "+33 6 12 34 56 78",
  photoUrl: "https://example.com/photo.jpg",
  experiences: [
    {
      id: "exp-1",
      title: "Lead Engineer",
      company: "Acme",
      description: "Led frontend team of 5 engineers.",
    },
    {
      id: "exp-2",
      title: "Dev Junior",
      company: "Startup",
      description: "Built React components.",
    },
  ],
  skills: [
    { id: "sk-1", name: "React" },
    { id: "sk-2", name: "TypeScript" },
    { id: "sk-3", name: "Node.js" },
    { id: "sk-4", name: "PostgreSQL" },
    { id: "sk-5", name: "Docker" },
  ],
  education: [
    { id: "edu-1", institution: "EPITA", degree: "Master Informatique" },
  ],
  socialLinks: {
    linkedinUrl: "https://linkedin.com/in/yoann",
  },
});

const makeEmptyCv = () => ({
  fullName: "   ",
  headline: null,
  summary: null,
  email: null,
  phone: null,
  photoUrl: null,
  experiences: [],
  skills: [],
  education: [],
  socialLinks: null,
});

describe("computeMasterCvCompleteness", () => {
  it("retourne 100% pour un CV complet", () => {
    const result = computeMasterCvCompleteness(makeFullCv());
    expect(result.score).toBe(100);
    expect(result.missing).toEqual([]);
  });

  it("retourne 0% pour un CV totalement vide", () => {
    const result = computeMasterCvCompleteness(makeEmptyCv());
    expect(result.score).toBe(0);
    expect(result.missing).toHaveLength(10);
  });

  it("detecte le nom complet manquant quand vide ou espaces", () => {
    const cv = { ...makeFullCv(), fullName: "   " };
    const result = computeMasterCvCompleteness(cv);
    expect(result.missing).toContain("Nom complet");
  });

  it("detecte le titre professionnel manquant", () => {
    const cv = { ...makeFullCv(), headline: null };
    const result = computeMasterCvCompleteness(cv);
    expect(result.missing).toContain("Titre professionnel");
    expect(result.score).toBe(90);
  });

  it("detecte le résumé manquant", () => {
    const cv = { ...makeFullCv(), summary: null };
    const result = computeMasterCvCompleteness(cv);
    expect(result.missing).toContain("Résumé");
  });

  it("detecte l'email manquant", () => {
    const cv = { ...makeFullCv(), email: null };
    const result = computeMasterCvCompleteness(cv);
    expect(result.missing).toContain("Email");
  });

  it("detecte le telephone manquant", () => {
    const cv = { ...makeFullCv(), phone: null };
    const result = computeMasterCvCompleteness(cv);
    expect(result.missing).toContain("Téléphone");
  });

  it("detecte quand il y a moins de 2 experiences", () => {
    const cv = {
      ...makeFullCv(),
      experiences: [
        { id: "exp-1", title: "Dev", company: "Corp", description: "Work" },
      ],
    };
    const result = computeMasterCvCompleteness(cv);
    expect(result.missing).toContain("Au moins 2 expériences");
  });

  it("detecte quand aucune experience n'a de description", () => {
    const cv = {
      ...makeFullCv(),
      experiences: [
        { id: "exp-1", title: "Dev", company: "A" },
        { id: "exp-2", title: "Dev", company: "B" },
      ],
    };
    const result = computeMasterCvCompleteness(cv);
    expect(result.missing).toContain("Expériences avec description");
  });

  it("detecte quand il y a moins de 5 competences", () => {
    const cv = {
      ...makeFullCv(),
      skills: [
        { id: "sk-1", name: "React" },
        { id: "sk-2", name: "TS" },
      ],
    };
    const result = computeMasterCvCompleteness(cv);
    expect(result.missing).toContain("Au moins 5 compétences");
  });

  it("detecte quand il n'y a pas de formation", () => {
    const cv = { ...makeFullCv(), education: [] };
    const result = computeMasterCvCompleteness(cv);
    expect(result.missing).toContain("Au moins 1 formation");
  });

  it("detecte quand il n'y a pas de lien social", () => {
    const cv = { ...makeFullCv(), socialLinks: null };
    const result = computeMasterCvCompleteness(cv);
    expect(result.missing).toContain("Au moins 1 lien social");
  });

  it("gere socialLinks comme objet vide", () => {
    const cv = { ...makeFullCv(), socialLinks: {} };
    const result = computeMasterCvCompleteness(cv);
    expect(result.missing).toContain("Au moins 1 lien social");
  });

  it("gere socialLinks avec des valeurs vides", () => {
    const cv = {
      ...makeFullCv(),
      socialLinks: { linkedinUrl: "", githubUrl: "   " },
    };
    const result = computeMasterCvCompleteness(cv);
    expect(result.missing).toContain("Au moins 1 lien social");
  });

  it("calcule un score intermediaire correct (50%)", () => {
    const cv = {
      fullName: "Yoann Andrieux",
      headline: "Dev",
      summary: "Summary here",
      email: "y@test.com",
      phone: "+33 6 00 00 00 00",
      photoUrl: null,
      experiences: [],
      skills: [],
      education: [],
      socialLinks: null,
    };
    const result = computeMasterCvCompleteness(cv);
    // fullName, headline, summary, email, phone = 5 sur 10
    expect(result.score).toBe(50);
    expect(result.missing).toHaveLength(5);
  });

  it("gere experiences comme null ou undefined (non-array)", () => {
    const cv = {
      ...makeFullCv(),
      experiences: null as unknown,
      skills: null as unknown,
      education: null as unknown,
    };
    const result = computeMasterCvCompleteness(cv);
    expect(result.missing).toContain("Au moins 2 expériences");
    expect(result.missing).toContain("Expériences avec description");
    expect(result.missing).toContain("Au moins 5 compétences");
    expect(result.missing).toContain("Au moins 1 formation");
  });

  it("arrondit le score correctement", () => {
    // 3 sur 10 = 30%
    const cv = {
      fullName: "Yoann",
      headline: "Dev",
      summary: "Bio",
      email: null,
      phone: null,
      photoUrl: null,
      experiences: [],
      skills: [],
      education: [],
      socialLinks: null,
    };
    const result = computeMasterCvCompleteness(cv);
    expect(result.score).toBe(30);
    expect(Number.isInteger(result.score)).toBe(true);
  });
});
