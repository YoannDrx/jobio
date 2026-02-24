import { renderCvLabHtml } from "@/features/cv-lab/cv-renderer";
import type { ResolvedCvContent } from "@/features/cv-lab/cv-content-resolver";
import { describe, expect, it } from "vitest";

type RenderableDocument = Parameters<typeof renderCvLabHtml>[0];

const makeContent = (): ResolvedCvContent => ({
  fullName: "Ada Lovelace",
  headline: "Product Engineer",
  summary: "Experienced engineer focused on quality and delivery.",
  email: "ada@example.com",
  phone: "+33 6 12 34 56 78",
  city: "Paris",
  photoUrl: null,
  hobbies: [],
  driverLicenses: [],
  socialLinks: {},
  skills: [{ id: "s1", name: "TypeScript", level: "expert" }],
  experiences: [
    {
      id: "e1",
      title: "Lead Engineer",
      company: "Jobio",
      startDate: "2020-01",
      endDate: "2024-01",
      description: "Built high quality product features.",
    },
  ],
  education: [{ id: "ed1", degree: "Master", institution: "EPITA" }],
  certifications: [{ id: "c1", name: "AWS Developer" }],
  languages: [{ id: "l1", name: "French", level: "Native" }],
  projects: [{ id: "p1", name: "CV Lab", description: "Premium CV builder." }],
});

const makeDocument = (pageSize: "A4" | "LETTER"): RenderableDocument => ({
  name: "CV Product Engineer",
  targetRole: "Senior Engineer",
  template: "CLASSIC",
  theme: "MODERN",
  pageSize,
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
});

describe("renderCvLabHtml", () => {
  it("always renders A4 page size, even when document is LETTER", () => {
    const html = renderCvLabHtml(makeDocument("LETTER"), makeContent());

    expect(html).toContain("size: 210mm 297mm;");
    expect(html).not.toContain("size: Letter;");
  });

  it("includes anti-split CSS rules for section and item blocks", () => {
    const html = renderCvLabHtml(makeDocument("A4"), makeContent());

    expect(html).toContain("break-inside: avoid;");
    expect(html).toContain("page-break-inside: avoid;");
    expect(html).toContain("-webkit-column-break-inside: avoid;");
  });
});
