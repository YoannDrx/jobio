import { analyzeCvAts } from "@/features/cv-lab/cv-ats";
import type { ResolvedCvContent } from "@/features/cv-lab/cv-content-resolver";
import { describe, expect, it } from "vitest";

const makeContent = (
  overrides: Partial<ResolvedCvContent> = {},
): ResolvedCvContent => ({
  fullName: "Ada Lovelace",
  headline: "Senior Full Stack Engineer",
  summary:
    "Developpeuse orientee produit, focalisee sur la performance et la fiabilite.",
  email: "ada@example.com",
  phone: "+33 6 12 34 56 78",
  city: "Paris",
  photoUrl: null,
  hobbies: [],
  driverLicenses: [],
  skills: [
    { id: "s1", name: "React", level: "expert" },
    { id: "s2", name: "TypeScript", level: "expert" },
    { id: "s3", name: "Node.js", level: "advanced" },
    { id: "s4", name: "PostgreSQL", level: "advanced" },
    { id: "s5", name: "Docker", level: "intermediate" },
  ],
  experiences: [
    {
      id: "e1",
      title: "Lead Engineer",
      company: "Acme",
      startDate: "2020-01",
      endDate: "2024-01",
      description:
        "Led migration to React + TypeScript and improved conversion by 31% on signup funnel.",
    },
  ],
  education: [
    { id: "ed1", degree: "Master Informatique", institution: "EPITA" },
  ],
  certifications: [{ id: "c1", name: "AWS Certified Developer" }],
  languages: [
    { id: "l1", name: "Francais", level: "Natif" },
    { id: "l2", name: "Anglais", level: "B2" },
  ],
  projects: [
    {
      id: "p1",
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
      content: makeContent(),
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
      content: makeContent({
        summary: null,
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
    expect(
      analysis.gaps.some((gap) => gap.includes("Sections manquantes")),
    ).toBe(true);
    expect(analysis.recommendations.length).toBeGreaterThan(0);
  });
});
