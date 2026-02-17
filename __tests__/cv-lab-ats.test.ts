import { analyzeCvAts } from "@/features/cv-lab/cv-ats";
import { describe, expect, it } from "vitest";

const makeProfile = (overrides: Record<string, unknown> = {}) => ({
  name: "Ada Lovelace",
  headline: "Senior Full Stack Engineer",
  bio: "Developpeuse orientee produit, focalisee sur la performance et la fiabilite.",
  skills: [
    { name: "React", level: "expert" },
    { name: "TypeScript", level: "expert" },
    { name: "Node.js", level: "advanced" },
    { name: "PostgreSQL", level: "advanced" },
    { name: "Docker", level: "intermediate" },
  ],
  experiences: [
    {
      title: "Lead Engineer",
      company: "Acme",
      description:
        "Led migration to React + TypeScript and improved conversion by 31% on signup funnel.",
    },
  ],
  education: [{ degree: "Master Informatique", school: "EPITA" }],
  certifications: [{ name: "AWS Certified Developer" }],
  languages: [{ name: "Francais", level: "Natif" }, { name: "Anglais", level: "B2" }],
  projects: [
    {
      name: "Analytics Platform",
      description: "Built a platform used by 42000 users monthly.",
    },
  ],
  ...overrides,
});

const makeDocument = (overrides: Record<string, unknown> = {}) => ({
  name: "CV Product Engineer",
  targetRole: "Senior React TypeScript Engineer",
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
  ...overrides,
});

describe("analyzeCvAts", () => {
  it("returns a strong score when CV and job description are aligned", () => {
    const analysis = analyzeCvAts({
      profile: makeProfile(),
      document: makeDocument(),
      jobDescription:
        "We need a senior React and TypeScript engineer with Node.js, PostgreSQL and Docker experience to improve conversion and product metrics.",
    });

    expect(analysis.overallScore).toBeGreaterThanOrEqual(65);
    expect(analysis.scoreBreakdown.completeness).toBeGreaterThanOrEqual(80);
    expect(analysis.keywordMetrics.coverage).toBeGreaterThanOrEqual(40);
    expect(analysis.details.quantifiableStatements).toBeGreaterThanOrEqual(2);
    expect(analysis.strengths.length).toBeGreaterThan(0);
  });

  it("detects missing content and keywords on a sparse CV", () => {
    const analysis = analyzeCvAts({
      profile: makeProfile({
        bio: null,
        skills: [],
        experiences: [],
        projects: [],
        education: [],
        certifications: [],
        languages: [],
      }),
      document: makeDocument({
        sectionOrder: ["summary", "experiences", "skills"],
        hiddenSections: ["summary", "experiences", "skills"],
        targetRole: "Data Engineer Python SQL",
      }),
      jobDescription:
        "Looking for a data engineer with Python, SQL, Airflow, dbt, ETL and data warehouse expertise.",
    });

    expect(analysis.scoreBreakdown.completeness).toBeLessThan(45);
    expect(analysis.keywordMetrics.missingKeywords.length).toBeGreaterThan(0);
    expect(analysis.gaps.some((gap) => gap.includes("Sections manquantes"))).toBe(
      true,
    );
    expect(analysis.recommendations.length).toBeGreaterThan(0);
  });
});
