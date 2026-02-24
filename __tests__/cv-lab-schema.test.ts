import { describe, expect, it } from "vitest";
import {
  cvLabTemplateSchema,
  cvLabThemeSchema,
  cvLabPageSizeSchema,
  cvLabSectionSchema,
  masterCvExperienceSchema,
  masterCvSkillSchema,
  masterCvEducationSchema,
  masterCvProjectSchema,
  masterCvLanguageSchema,
  masterCvCertificationSchema,
  masterCvPersonalInfoSchema,
  socialLinksSchema,
  contentOverrideItemSchema,
  contentOverridesSchema,
  hiddenItemsSchema,
  personalInfoOverridesSchema,
  cvLabDocumentInputSchema,
  updateCvLabDocumentSchema,
  createCvLabVersionSchema,
  restoreCvLabVersionSchema,
  contractTypeSchema,
  remoteModeSchema,
  CV_LAB_TEMPLATES,
  CV_LAB_THEMES,
  CV_LAB_PAGE_SIZES,
  CV_LAB_SECTIONS,
  CONTRACT_TYPES,
  REMOTE_MODES,
} from "@/features/cv-lab/cv-lab.schema";

// --- Enum schemas ---

describe("cvLabTemplateSchema", () => {
  it.each(CV_LAB_TEMPLATES)("accepte le template '%s'", (template) => {
    expect(cvLabTemplateSchema.parse(template)).toBe(template);
  });

  it("rejette une valeur invalide", () => {
    expect(() => cvLabTemplateSchema.parse("UNKNOWN")).toThrow();
  });
});

describe("cvLabThemeSchema", () => {
  it.each(CV_LAB_THEMES)("accepte le theme '%s'", (theme) => {
    expect(cvLabThemeSchema.parse(theme)).toBe(theme);
  });

  it("rejette une valeur invalide", () => {
    expect(() => cvLabThemeSchema.parse("NEON")).toThrow();
  });
});

describe("cvLabPageSizeSchema", () => {
  it.each(CV_LAB_PAGE_SIZES)("accepte la taille '%s'", (size) => {
    expect(cvLabPageSizeSchema.parse(size)).toBe(size);
  });

  it("rejette une valeur invalide", () => {
    expect(() => cvLabPageSizeSchema.parse("B5")).toThrow();
  });
});

describe("cvLabSectionSchema", () => {
  it.each(CV_LAB_SECTIONS)("accepte la section '%s'", (section) => {
    expect(cvLabSectionSchema.parse(section)).toBe(section);
  });

  it("rejette une section inconnue", () => {
    expect(() => cvLabSectionSchema.parse("hobbies")).toThrow();
  });
});

describe("contractTypeSchema", () => {
  it.each(CONTRACT_TYPES)("accepte le type de contrat '%s'", (ct) => {
    expect(contractTypeSchema.parse(ct)).toBe(ct);
  });

  it("rejette un type invalide", () => {
    expect(() => contractTypeSchema.parse("INTERIM")).toThrow();
  });
});

describe("remoteModeSchema", () => {
  it.each(REMOTE_MODES)("accepte le mode '%s'", (mode) => {
    expect(remoteModeSchema.parse(mode)).toBe(mode);
  });

  it("rejette un mode invalide", () => {
    expect(() => remoteModeSchema.parse("FLEX")).toThrow();
  });
});

// --- Item schemas ---

describe("masterCvExperienceSchema", () => {
  it("parse une experience valide minimale", () => {
    const result = masterCvExperienceSchema.parse({
      id: "exp-1",
      title: "Dev Frontend",
      company: "Acme",
    });
    expect(result.id).toBe("exp-1");
    expect(result.title).toBe("Dev Frontend");
    expect(result.company).toBe("Acme");
  });

  it("parse une experience valide complete", () => {
    const result = masterCvExperienceSchema.parse({
      id: "exp-2",
      title: "Lead Engineer",
      company: "Corp",
      startDate: "2021-01",
      endDate: "2023-12",
      description: "Led team of 5",
      current: false,
      location: "Paris",
      contractType: "CDI",
      remote: "HYBRID",
      techStack: ["React", "Node.js"],
      achievements: ["Reduced load time by 40%"],
      teamContext: "Team of 5 engineers",
    });
    expect(result.contractType).toBe("CDI");
    expect(result.remote).toBe("HYBRID");
    expect(result.techStack).toEqual(["React", "Node.js"]);
  });

  it("rejette si title est vide", () => {
    expect(() =>
      masterCvExperienceSchema.parse({ id: "exp-1", title: "", company: "X" }),
    ).toThrow();
  });

  it("rejette si company est vide", () => {
    expect(() =>
      masterCvExperienceSchema.parse({
        id: "exp-1",
        title: "Dev",
        company: "",
      }),
    ).toThrow();
  });

  it("rejette si id est manquant", () => {
    expect(() =>
      masterCvExperienceSchema.parse({ title: "Dev", company: "X" }),
    ).toThrow();
  });
});

describe("masterCvSkillSchema", () => {
  it("parse une competence valide", () => {
    const result = masterCvSkillSchema.parse({
      id: "sk-1",
      name: "React",
      level: "Expert",
    });
    expect(result.name).toBe("React");
  });

  it("parse sans level (optionnel)", () => {
    const result = masterCvSkillSchema.parse({ id: "sk-2", name: "Docker" });
    expect(result.level).toBeUndefined();
  });

  it("rejette si name est vide", () => {
    expect(() => masterCvSkillSchema.parse({ id: "sk-1", name: "" })).toThrow();
  });
});

describe("masterCvEducationSchema", () => {
  it("parse une formation valide", () => {
    const result = masterCvEducationSchema.parse({
      id: "edu-1",
      institution: "EPITA",
      degree: "Master Informatique",
    });
    expect(result.institution).toBe("EPITA");
  });

  it("rejette si institution est vide", () => {
    expect(() =>
      masterCvEducationSchema.parse({
        id: "edu-1",
        institution: "",
        degree: "Master",
      }),
    ).toThrow();
  });

  it("rejette si degree est vide", () => {
    expect(() =>
      masterCvEducationSchema.parse({
        id: "edu-1",
        institution: "EPITA",
        degree: "",
      }),
    ).toThrow();
  });
});

describe("masterCvProjectSchema", () => {
  it("parse un projet valide minimal", () => {
    const result = masterCvProjectSchema.parse({
      id: "proj-1",
      name: "Jobio",
    });
    expect(result.name).toBe("Jobio");
  });

  it("parse un projet avec tous les champs optionnels", () => {
    const result = masterCvProjectSchema.parse({
      id: "proj-1",
      name: "CV Lab",
      description: "CV builder",
      url: "https://jobio.app",
      technologies: ["Next.js", "Prisma"],
      role: "Lead Dev",
      startDate: "2024-01",
      endDate: "2024-06",
      highlights: ["Built PDF export"],
      status: "completed",
    });
    expect(result.technologies).toEqual(["Next.js", "Prisma"]);
    expect(result.highlights).toEqual(["Built PDF export"]);
  });

  it("rejette si name est vide", () => {
    expect(() =>
      masterCvProjectSchema.parse({ id: "proj-1", name: "" }),
    ).toThrow();
  });
});

describe("masterCvLanguageSchema", () => {
  it("parse une langue valide", () => {
    const result = masterCvLanguageSchema.parse({
      id: "lang-1",
      name: "Francais",
      level: "Natif",
    });
    expect(result.name).toBe("Francais");
  });

  it("rejette si level est vide", () => {
    expect(() =>
      masterCvLanguageSchema.parse({
        id: "lang-1",
        name: "Anglais",
        level: "",
      }),
    ).toThrow();
  });
});

describe("masterCvCertificationSchema", () => {
  it("parse une certification valide", () => {
    const result = masterCvCertificationSchema.parse({
      id: "cert-1",
      name: "AWS Solutions Architect",
      issuer: "AWS",
      date: "2024-03",
      url: "https://aws.amazon.com/cert",
    });
    expect(result.issuer).toBe("AWS");
  });

  it("parse sans champs optionnels", () => {
    const result = masterCvCertificationSchema.parse({
      id: "cert-1",
      name: "PMP",
    });
    expect(result.issuer).toBeUndefined();
  });
});

// --- Composite schemas ---

describe("socialLinksSchema", () => {
  it("parse un objet vide", () => {
    const result = socialLinksSchema.parse({});
    expect(result).toEqual({});
  });

  it("parse avec tous les liens", () => {
    const result = socialLinksSchema.parse({
      linkedinUrl: "https://linkedin.com/in/yoann",
      githubUrl: "https://github.com/yoann",
      websiteUrl: "https://yoann.dev",
      maltUrl: "https://malt.fr/profile/yoann",
    });
    expect(result.linkedinUrl).toBe("https://linkedin.com/in/yoann");
  });
});

describe("masterCvPersonalInfoSchema", () => {
  it("parse avec fullName minimum", () => {
    const result = masterCvPersonalInfoSchema.parse({
      fullName: "Yoann Andrieux",
    });
    expect(result.fullName).toBe("Yoann Andrieux");
    expect(result.hobbies).toEqual([]);
    expect(result.driverLicenses).toEqual([]);
  });

  it("rejette si fullName est vide", () => {
    expect(() => masterCvPersonalInfoSchema.parse({ fullName: "" })).toThrow();
  });

  it("applique les defaults pour hobbies et driverLicenses", () => {
    const result = masterCvPersonalInfoSchema.parse({
      fullName: "Test User",
    });
    expect(result.hobbies).toEqual([]);
    expect(result.driverLicenses).toEqual([]);
  });
});

describe("contentOverrideItemSchema", () => {
  it("parse avec masterItemId seul", () => {
    const result = contentOverrideItemSchema.parse({
      masterItemId: "exp-1",
    });
    expect(result.masterItemId).toBe("exp-1");
  });

  it("parse avec override de titre et description", () => {
    const result = contentOverrideItemSchema.parse({
      masterItemId: "exp-1",
      title: "Senior Dev",
      description: "Led refactoring",
    });
    expect(result.title).toBe("Senior Dev");
  });

  it("parse avec champs d'enrichissement experience", () => {
    const result = contentOverrideItemSchema.parse({
      masterItemId: "exp-1",
      contractType: "FREELANCE",
      remote: "REMOTE",
      techStack: ["React"],
      achievements: ["Shipped v2"],
      teamContext: "Solo",
    });
    expect(result.contractType).toBe("FREELANCE");
    expect(result.remote).toBe("REMOTE");
  });

  it("rejette si masterItemId est manquant", () => {
    expect(() => contentOverrideItemSchema.parse({ title: "Dev" })).toThrow();
  });
});

describe("contentOverridesSchema", () => {
  it("parse un objet vide", () => {
    const result = contentOverridesSchema.parse({});
    expect(result).toEqual({});
  });

  it("parse avec des overrides sur plusieurs sections", () => {
    const result = contentOverridesSchema.parse({
      experiences: [{ masterItemId: "exp-1", title: "Overridden" }],
      skills: [{ masterItemId: "sk-1", name: "React Native" }],
    });
    expect(result.experiences).toHaveLength(1);
    expect(result.skills).toHaveLength(1);
  });
});

describe("hiddenItemsSchema", () => {
  it("parse un record valide avec toutes les cles", () => {
    const result = hiddenItemsSchema.parse({
      experiences: ["exp-1", "exp-2"],
      skills: ["sk-3"],
      education: [],
      projects: [],
      languages: [],
      certifications: [],
    });
    expect(result.experiences).toEqual(["exp-1", "exp-2"]);
    expect(result.skills).toEqual(["sk-3"]);
    expect(result.education).toEqual([]);
  });

  it("rejette une cle de section invalide", () => {
    expect(() =>
      hiddenItemsSchema.parse({
        hobbies: ["h-1"],
        experiences: [],
        skills: [],
        education: [],
        projects: [],
        languages: [],
        certifications: [],
      }),
    ).toThrow();
  });
});

describe("personalInfoOverridesSchema", () => {
  it("parse un objet vide", () => {
    const result = personalInfoOverridesSchema.parse({});
    expect(result).toEqual({});
  });

  it("parse avec overrides partiels", () => {
    const result = personalInfoOverridesSchema.parse({
      headline: "Architecte Cloud",
      city: "Lyon",
    });
    expect(result.headline).toBe("Architecte Cloud");
    expect(result.fullName).toBeUndefined();
  });
});

// --- Document schemas ---

describe("cvLabDocumentInputSchema", () => {
  const validDoc = {
    profileId: "prof-1",
    name: "Mon CV",
  };

  it("parse un document avec les valeurs minimales et applique les defaults", () => {
    const result = cvLabDocumentInputSchema.parse(validDoc);
    expect(result.profileId).toBe("prof-1");
    expect(result.name).toBe("Mon CV");
    expect(result.template).toBe("CLASSIC");
    expect(result.theme).toBe("MODERN");
    expect(result.pageSize).toBe("A4");
    expect(result.accentColor).toBe("#0f172a");
    expect(result.fontFamily).toBe("Inter");
    expect(result.sectionOrder).toEqual([...CV_LAB_SECTIONS]);
    expect(result.hiddenSections).toEqual([]);
  });

  it("rejette si profileId est vide", () => {
    expect(() =>
      cvLabDocumentInputSchema.parse({ ...validDoc, profileId: "" }),
    ).toThrow();
  });

  it("rejette si name est trop court (moins de 2 caracteres)", () => {
    expect(() =>
      cvLabDocumentInputSchema.parse({ ...validDoc, name: "A" }),
    ).toThrow();
  });

  it("rejette si name depasse 80 caracteres", () => {
    expect(() =>
      cvLabDocumentInputSchema.parse({ ...validDoc, name: "A".repeat(81) }),
    ).toThrow();
  });

  it("rejette un accentColor invalide", () => {
    expect(() =>
      cvLabDocumentInputSchema.parse({ ...validDoc, accentColor: "red" }),
    ).toThrow();
    expect(() =>
      cvLabDocumentInputSchema.parse({ ...validDoc, accentColor: "#GGG" }),
    ).toThrow();
  });

  it("accepte un accentColor hex valide", () => {
    const result = cvLabDocumentInputSchema.parse({
      ...validDoc,
      accentColor: "#ff5733",
    });
    expect(result.accentColor).toBe("#ff5733");
  });

  it("normalise sectionOrder en completant les sections manquantes", () => {
    const result = cvLabDocumentInputSchema.parse({
      ...validDoc,
      sectionOrder: ["skills", "experiences"],
    });
    expect(result.sectionOrder[0]).toBe("skills");
    expect(result.sectionOrder[1]).toBe("experiences");
    expect(result.sectionOrder).toHaveLength(CV_LAB_SECTIONS.length);
  });

  it("deduplique sectionOrder", () => {
    const result = cvLabDocumentInputSchema.parse({
      ...validDoc,
      sectionOrder: ["skills", "skills", "experiences"],
    });
    const skillsCount = result.sectionOrder.filter(
      (s: string) => s === "skills",
    ).length;
    expect(skillsCount).toBe(1);
  });

  it("deduplique hiddenSections", () => {
    const result = cvLabDocumentInputSchema.parse({
      ...validDoc,
      hiddenSections: ["skills", "skills"],
    });
    expect(result.hiddenSections).toEqual(["skills"]);
  });

  it("accepte nullable pour targetRole, headlineOverride, summaryOverride", () => {
    const result = cvLabDocumentInputSchema.parse({
      ...validDoc,
      targetRole: null,
      headlineOverride: null,
      summaryOverride: null,
    });
    expect(result.targetRole).toBeNull();
    expect(result.headlineOverride).toBeNull();
    expect(result.summaryOverride).toBeNull();
  });
});

describe("updateCvLabDocumentSchema", () => {
  it("requiert un id", () => {
    expect(() => updateCvLabDocumentSchema.parse({})).toThrow();
  });

  it("accepte une mise a jour partielle avec id", () => {
    const result = updateCvLabDocumentSchema.parse({
      id: "doc-1",
      name: "CV Updated",
    });
    expect(result.id).toBe("doc-1");
    expect(result.name).toBe("CV Updated");
    // partial() preserves .default() so template gets its default value
    expect(result.template).toBe("CLASSIC");
  });
});

describe("createCvLabVersionSchema", () => {
  it("parse avec documentId seul", () => {
    const result = createCvLabVersionSchema.parse({
      documentId: "doc-1",
    });
    expect(result.documentId).toBe("doc-1");
    expect(result.label).toBeUndefined();
  });

  it("parse avec label", () => {
    const result = createCvLabVersionSchema.parse({
      documentId: "doc-1",
      label: "Version finale",
    });
    expect(result.label).toBe("Version finale");
  });

  it("rejette si label est trop court", () => {
    expect(() =>
      createCvLabVersionSchema.parse({ documentId: "doc-1", label: "A" }),
    ).toThrow();
  });
});

describe("restoreCvLabVersionSchema", () => {
  it("parse avec documentId et versionId", () => {
    const result = restoreCvLabVersionSchema.parse({
      documentId: "doc-1",
      versionId: "ver-1",
    });
    expect(result.documentId).toBe("doc-1");
    expect(result.versionId).toBe("ver-1");
  });

  it("rejette si versionId est manquant", () => {
    expect(() =>
      restoreCvLabVersionSchema.parse({ documentId: "doc-1" }),
    ).toThrow();
  });
});
