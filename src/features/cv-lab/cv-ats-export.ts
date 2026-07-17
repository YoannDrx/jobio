import { CV_LAB_SECTIONS, type CvLabSection } from "./cv-lab.schema";
import type { ResolvedCvContent } from "./cv-content-resolver";

type AtsExportDocument = {
  targetRole: string | null;
  headlineOverride: string | null;
  summaryOverride: string | null;
  sectionOrder: unknown;
  hiddenSections: unknown;
};

const SECTION_TITLES: Record<CvLabSection, string> = {
  summary: "PROFIL",
  experiences: "EXPÉRIENCES",
  skills: "COMPÉTENCES",
  projects: "PROJETS",
  education: "FORMATION",
  languages: "LANGUES",
  certifications: "CERTIFICATIONS",
};

const cleanText = (value: string | null | undefined) =>
  (value ?? "")
    .replace(/\[([^\]]+)]\(([^)]+)\)/g, "$1 ($2)")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/^\s*[-*]\s+/gm, "- ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const compact = (values: (string | null | undefined)[]) =>
  values.map(cleanText).filter(Boolean);

const normalizeSections = (document: AtsExportDocument) => {
  const requested = Array.isArray(document.sectionOrder)
    ? document.sectionOrder.filter((section): section is CvLabSection =>
        CV_LAB_SECTIONS.includes(section as CvLabSection),
      )
    : [];
  const order = [
    ...new Set([...requested, ...CV_LAB_SECTIONS]),
  ] as CvLabSection[];
  const hidden = new Set(
    Array.isArray(document.hiddenSections)
      ? document.hiddenSections.filter((section): section is CvLabSection =>
          CV_LAB_SECTIONS.includes(section as CvLabSection),
        )
      : [],
  );

  return order.filter((section) => !hidden.has(section));
};

const renderSection = (
  section: CvLabSection,
  document: AtsExportDocument,
  content: ResolvedCvContent,
) => {
  switch (section) {
    case "summary":
      return cleanText(document.summaryOverride ?? content.summary);
    case "experiences":
      return content.experiences
        .map((experience) => {
          const title = compact([experience.title, experience.company]).join(
            " — ",
          );
          const context = compact([
            [experience.startDate, experience.endDate]
              .filter(Boolean)
              .join(" – "),
            experience.location,
            experience.contractType,
            experience.remote,
          ]).join(" | ");
          const achievements = (experience.achievements ?? [])
            .map((achievement) => `- ${cleanText(achievement)}`)
            .join("\n");
          const technologies = (experience.techStack ?? [])
            .map(cleanText)
            .filter(Boolean)
            .join(", ");

          return compact([
            title,
            context,
            experience.teamContext,
            experience.description,
            achievements,
            technologies ? `Technologies : ${technologies}` : "",
          ]).join("\n");
        })
        .filter(Boolean)
        .join("\n\n");
    case "skills":
      return content.skills
        .map((skill) =>
          cleanText(
            skill.level ? `${skill.name} — ${skill.level}` : skill.name,
          ),
        )
        .filter(Boolean)
        .join("\n");
    case "projects":
      return content.projects
        .map((project) => {
          const context = compact([
            project.role,
            [project.startDate, project.endDate].filter(Boolean).join(" – "),
            project.status,
            project.url,
          ]).join(" | ");
          const highlights = (project.highlights ?? [])
            .map((highlight) => `- ${cleanText(highlight)}`)
            .join("\n");
          const technologies = (project.technologies ?? [])
            .map(cleanText)
            .filter(Boolean)
            .join(", ");

          return compact([
            project.name,
            context,
            project.description,
            highlights,
            technologies ? `Technologies : ${technologies}` : "",
          ]).join("\n");
        })
        .filter(Boolean)
        .join("\n\n");
    case "education":
      return content.education
        .map((education) =>
          compact([
            `${education.degree} — ${education.institution}`,
            compact([
              education.field,
              [education.startDate, education.endDate]
                .filter(Boolean)
                .join(" – "),
            ]).join(" | "),
            education.description,
          ]).join("\n"),
        )
        .filter(Boolean)
        .join("\n\n");
    case "languages":
      return content.languages
        .map(
          (language) =>
            `${cleanText(language.name)} — ${cleanText(language.level)}`,
        )
        .join("\n");
    case "certifications":
      return content.certifications
        .map((certification) =>
          compact([
            certification.name,
            compact([
              certification.issuer,
              certification.date,
              certification.url,
            ]).join(" | "),
          ]).join(" — "),
        )
        .filter(Boolean)
        .join("\n");
  }
};

export function renderCvAtsText(
  document: AtsExportDocument,
  content: ResolvedCvContent,
) {
  const headline = cleanText(document.headlineOverride ?? content.headline);
  const targetRole = cleanText(document.targetRole);
  const contactLine = compact([
    content.email,
    content.phone,
    content.city,
  ]).join(" | ");
  const links = compact([
    content.socialLinks.linkedinUrl,
    content.socialLinks.githubUrl,
    content.socialLinks.websiteUrl,
    content.socialLinks.maltUrl,
  ]).join("\n");
  const licenses = content.driverLicenses.map(cleanText).filter(Boolean);

  const sections = normalizeSections(document)
    .map((section) => {
      const body = renderSection(section, document, content);
      return body ? `${SECTION_TITLES[section]}\n${body}` : "";
    })
    .filter(Boolean);

  return [
    cleanText(content.fullName),
    targetRole || headline,
    targetRole && headline && targetRole !== headline ? headline : "",
    contactLine,
    links,
    licenses.length > 0 ? `Permis : ${licenses.join(", ")}` : "",
    ...sections,
  ]
    .filter(Boolean)
    .join("\n\n")
    .concat("\n");
}
