import { describe, expect, it } from "vitest";
import {
  resolveCvContent,
  resolveCvContentFromProfile,
} from "@/features/cv-lab/cv-content-resolver";

const baseMasterCv = {
  fullName: "Yoann Andrieux",
  headline: "Développeur Frontend",
  summary: "Passionné par le web",
  email: "yoann@test.com",
  phone: "+33 6 12 34 56 78",
  city: "Paris 20e",
  photoUrl: "https://example.com/photo.jpg",
  hobbies: ["Randonnée", "Musique"],
  driverLicenses: ["Permis B"],
  socialLinks: null,
  experiences: [
    {
      id: "exp-1",
      title: "Senior Dev",
      company: "Acme Corp",
      startDate: "2021-01",
      description: "Lead frontend",
    },
    {
      id: "exp-2",
      title: "Dev Junior",
      company: "Startup XYZ",
      startDate: "2019-01",
      endDate: "2020-12",
      description: "React/Next.js",
    },
  ],
  skills: [
    { id: "sk-1", name: "React", level: "Expert" },
    { id: "sk-2", name: "TypeScript", level: "Avancé" },
    { id: "sk-3", name: "Python", level: "Intermédiaire" },
  ],
  education: [
    {
      id: "edu-1",
      institution: "La Capsule",
      degree: "Bootcamp",
      field: "Développement Web",
    },
  ],
  projects: [
    { id: "proj-1", name: "Jobio", description: "Plateforme freelance" },
  ],
  languages: [
    { id: "lang-1", name: "Français", level: "Natif" },
    { id: "lang-2", name: "Anglais", level: "Courant" },
  ],
  certifications: [
    { id: "cert-1", name: "AWS Solutions Architect", issuer: "AWS" },
  ],
};

const emptyOverrides = {
  contentOverrides: null,
  hiddenItems: null,
  personalInfo: null,
};

describe("resolveCvContent", () => {
  it("retourne les données du master sans modification quand aucun override", () => {
    const result = resolveCvContent(baseMasterCv, emptyOverrides);

    expect(result.fullName).toBe("Yoann Andrieux");
    expect(result.headline).toBe("Développeur Frontend");
    expect(result.email).toBe("yoann@test.com");
    expect(result.hobbies).toEqual(["Randonnée", "Musique"]);
    expect(result.experiences).toHaveLength(2);
    expect(result.skills).toHaveLength(3);
    expect(result.education).toHaveLength(1);
    expect(result.languages).toHaveLength(2);
  });

  it("filtre les items masqués via hiddenItems", () => {
    const result = resolveCvContent(baseMasterCv, {
      ...emptyOverrides,
      hiddenItems: {
        experiences: ["exp-2"],
        skills: ["sk-3"],
      },
    });

    expect(result.experiences).toHaveLength(1);
    expect(result.experiences[0].id).toBe("exp-1");
    expect(result.skills).toHaveLength(2);
    expect(result.skills.find((s) => s.name === "Python")).toBeUndefined();
  });

  it("applique les overrides per-CV sur les items", () => {
    const result = resolveCvContent(baseMasterCv, {
      ...emptyOverrides,
      contentOverrides: {
        experiences: [
          {
            masterItemId: "exp-1",
            title: "Lead Frontend Engineer",
            description: "Refonte complète du produit",
          },
        ],
      },
    });

    expect(result.experiences).toHaveLength(2);
    expect(result.experiences[0].title).toBe("Lead Frontend Engineer");
    expect(result.experiences[0].description).toBe(
      "Refonte complète du produit",
    );
    expect(result.experiences[0].company).toBe("Acme Corp");
  });

  it("applique les overrides d'info personnelle", () => {
    const result = resolveCvContent(baseMasterCv, {
      ...emptyOverrides,
      personalInfo: {
        headline: "Architecte Frontend React/Next.js",
        city: "Lyon",
        hobbies: ["Escalade"],
      },
    });

    expect(result.fullName).toBe("Yoann Andrieux");
    expect(result.headline).toBe("Architecte Frontend React/Next.js");
    expect(result.city).toBe("Lyon");
    expect(result.hobbies).toEqual(["Escalade"]);
    expect(result.email).toBe("yoann@test.com");
  });

  it("combine filtrage + overrides + personal info", () => {
    const result = resolveCvContent(baseMasterCv, {
      contentOverrides: {
        skills: [{ masterItemId: "sk-1", name: "React / React Native" }],
      },
      hiddenItems: {
        certifications: ["cert-1"],
        languages: ["lang-2"],
      },
      personalInfo: {
        summary: "Résumé personnalisé pour ce poste",
      },
    });

    expect(result.skills[0].name).toBe("React / React Native");
    expect(result.certifications).toHaveLength(0);
    expect(result.languages).toHaveLength(1);
    expect(result.summary).toBe("Résumé personnalisé pour ce poste");
  });

  it("gère un master CV avec des champs vides/null", () => {
    const emptyMaster = {
      ...baseMasterCv,
      headline: null,
      summary: null,
      email: null,
      phone: null,
      city: null,
      photoUrl: null,
      hobbies: null,
      driverLicenses: null,
      experiences: null,
      skills: null,
      education: null,
      projects: null,
      languages: null,
      certifications: null,
    };

    const result = resolveCvContent(emptyMaster, emptyOverrides);

    expect(result.fullName).toBe("Yoann Andrieux");
    expect(result.headline).toBeNull();
    expect(result.hobbies).toEqual([]);
    expect(result.experiences).toEqual([]);
    expect(result.skills).toEqual([]);
  });

  it("masque tous les items d'une section", () => {
    const result = resolveCvContent(baseMasterCv, {
      ...emptyOverrides,
      hiddenItems: {
        experiences: ["exp-1", "exp-2"],
      },
    });

    expect(result.experiences).toHaveLength(0);
  });
});

describe("resolveCvContentFromProfile", () => {
  const baseProfile = {
    name: "Yoann Andrieux",
    headline: "Dev Frontend",
    bio: "Ma bio ici",
    experiences: [
      { id: "e1", title: "Dev", company: "Corp", startDate: "2020-01" },
    ],
    skills: [{ id: "s1", name: "React", level: "Expert" }],
    education: [],
    projects: [],
    languages: [{ id: "l1", name: "Français", level: "Natif" }],
    certifications: [],
  };

  it("retourne les données du profil sans modification", () => {
    const result = resolveCvContentFromProfile(baseProfile, emptyOverrides);

    expect(result.fullName).toBe("Yoann Andrieux");
    expect(result.headline).toBe("Dev Frontend");
    expect(result.summary).toBe("Ma bio ici");
    expect(result.email).toBeNull();
    expect(result.phone).toBeNull();
    expect(result.hobbies).toEqual([]);
    expect(result.experiences).toHaveLength(1);
  });

  it("applique les overrides personnels sur le profil", () => {
    const result = resolveCvContentFromProfile(baseProfile, {
      ...emptyOverrides,
      personalInfo: {
        email: "yoann@custom.com",
        phone: "+33 6 00 00 00 00",
        hobbies: ["Sport"],
      },
    });

    expect(result.email).toBe("yoann@custom.com");
    expect(result.phone).toBe("+33 6 00 00 00 00");
    expect(result.hobbies).toEqual(["Sport"]);
  });
});
