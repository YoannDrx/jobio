import { renderCvLabHtml } from "@/features/cv-lab/cv-renderer";
import { describe, expect, it } from "vitest";

type RenderableDocument = Parameters<typeof renderCvLabHtml>[0];
type RenderableProfile = Parameters<typeof renderCvLabHtml>[1];

const makeProfile = (): RenderableProfile =>
  ({
    name: "Ada Lovelace",
    headline: "Product Engineer",
    bio: "Experienced engineer focused on quality and delivery.",
    skills: [{ name: "TypeScript", level: "expert" }],
    experiences: [
      {
        title: "Lead Engineer",
        company: "Jobio",
        description: "Built high quality product features.",
      },
    ],
    education: [{ degree: "Master", school: "EPITA" }],
    certifications: [{ name: "AWS Developer" }],
    languages: [{ name: "French", level: "Native" }],
    projects: [{ name: "CV Lab", description: "Premium CV builder." }],
    tjmTarget: 650,
    zone: "Paris",
  });

const makeDocument = (pageSize: "A4" | "LETTER"): RenderableDocument =>
  ({
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
    const html = renderCvLabHtml(makeDocument("LETTER"), makeProfile());

    expect(html).toContain("size: A4;");
    expect(html).not.toContain("size: Letter;");
  });

  it("includes anti-split CSS rules for section and item blocks", () => {
    const html = renderCvLabHtml(makeDocument("A4"), makeProfile());

    expect(html).toContain("break-inside: avoid;");
    expect(html).toContain("page-break-inside: avoid;");
    expect(html).toContain("-webkit-column-break-inside: avoid;");
  });
});
