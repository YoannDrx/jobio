import { describe, expect, it } from "vitest";

import { renderCvAtsText } from "@/features/cv-lab/cv-ats-export";
import type { ResolvedCvContent } from "@/features/cv-lab/cv-content-resolver";

const content: ResolvedCvContent = {
  fullName: "Ada Lovelace",
  headline: "Product Engineer",
  summary: "Conçoit des produits **fiables** et accessibles.",
  email: "ada@example.com",
  phone: "+33 6 12 34 56 78",
  city: "Paris",
  photoUrl: "https://example.com/photo.jpg",
  hobbies: ["Mathématiques"],
  driverLicenses: ["B"],
  socialLinks: {
    linkedinUrl: "https://linkedin.com/in/ada",
    githubUrl: "https://github.com/ada",
  },
  experiences: [
    {
      id: "exp-1",
      title: "Lead Engineer",
      company: "Jobio",
      startDate: "2022-01",
      endDate: "2026-07",
      description: "A livré une plateforme utilisée en production.",
      achievements: ["Réduit le temps de réponse de 35 %"],
      techStack: ["React", "TypeScript"],
    },
  ],
  skills: [{ id: "skill-1", name: "TypeScript", level: "expert" }],
  projects: [],
  education: [],
  languages: [{ id: "lang-1", name: "Français", level: "Natif" }],
  certifications: [],
};

const document = {
  targetRole: "Senior Product Engineer",
  headlineOverride: null,
  summaryOverride: null,
  sectionOrder: ["summary", "experiences", "skills", "languages"],
  hiddenSections: [],
};

describe("renderCvAtsText", () => {
  it("exports a linear text document without visual-only content", () => {
    const result = renderCvAtsText(document, content);

    expect(result).toContain("Ada Lovelace");
    expect(result).toContain("Senior Product Engineer");
    expect(result).toContain("PROFIL\nConçoit des produits fiables");
    expect(result).toContain("Lead Engineer — Jobio");
    expect(result).toContain("Technologies : React, TypeScript");
    expect(result).toContain("Permis : B");
    expect(result).not.toContain("photo.jpg");
    expect(result).not.toContain("<");
    expect(result.endsWith("\n")).toBe(true);
  });

  it("uses editable overrides and excludes hidden sections", () => {
    const result = renderCvAtsText(
      {
        ...document,
        summaryOverride: "Résumé ciblé pour la mission.",
        hiddenSections: ["experiences"],
      },
      content,
    );

    expect(result).toContain("Résumé ciblé pour la mission.");
    expect(result).not.toContain("EXPÉRIENCES");
    expect(result).not.toContain("Lead Engineer");
  });
});
