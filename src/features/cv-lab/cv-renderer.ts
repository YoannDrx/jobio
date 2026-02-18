import type { CvLabDocument, UserProfile } from "@/generated/prisma";
import { CV_LAB_SECTIONS, type CvLabSection } from "./cv-lab.schema";

type RenderableProfile = Pick<
  UserProfile,
  | "name"
  | "headline"
  | "bio"
  | "skills"
  | "experiences"
  | "education"
  | "certifications"
  | "languages"
  | "projects"
  | "tjmTarget"
  | "zone"
>;

type RenderableDocument = Pick<
  CvLabDocument,
  | "name"
  | "targetRole"
  | "template"
  | "theme"
  | "pageSize"
  | "accentColor"
  | "fontFamily"
  | "headlineOverride"
  | "summaryOverride"
  | "sectionOrder"
  | "hiddenSections"
>;

const THEMES: Record<
  RenderableDocument["theme"],
  {
    bg: string;
    text: string;
    muted: string;
    surface: string;
  }
> = {
  MINIMAL: {
    bg: "#ffffff",
    text: "#0f172a",
    muted: "#475569",
    surface: "#f8fafc",
  },
  MODERN: {
    bg: "#f8fafc",
    text: "#0f172a",
    muted: "#334155",
    surface: "#ffffff",
  },
  CONTRAST: {
    bg: "#0b1220",
    text: "#f8fafc",
    muted: "#cbd5e1",
    surface: "#111c32",
  },
  BOLD: {
    bg: "#ffffff",
    text: "#111827",
    muted: "#4b5563",
    surface: "#f3f4f6",
  },
};

const sanitizeHex = (value: string) =>
  /^#[0-9a-fA-F]{6}$/.test(value) ? value : "#0f172a";

const escapeHtml = (value: string | null | undefined) => {
  if (!value) return "";
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
};

const normalizeSections = (
  sectionOrder: unknown,
  hiddenSections: unknown,
): {
  order: CvLabSection[];
  hidden: Set<CvLabSection>;
} => {
  const order =
    Array.isArray(sectionOrder) && sectionOrder.length > 0
      ? (sectionOrder
          .filter((value): value is CvLabSection =>
            CV_LAB_SECTIONS.includes(value as CvLabSection),
          )
          .filter(
            (value, index, arr) => arr.indexOf(value) === index,
          ) as CvLabSection[])
      : [...CV_LAB_SECTIONS];

  const hidden = new Set(
    Array.isArray(hiddenSections)
      ? (hiddenSections.filter((value): value is CvLabSection =>
          CV_LAB_SECTIONS.includes(value as CvLabSection),
        ) as CvLabSection[])
      : [],
  );

  const remaining = CV_LAB_SECTIONS.filter(
    (section) => !order.includes(section),
  );
  return {
    order: [...order, ...remaining],
    hidden,
  };
};

const asArray = <T>(value: unknown): T[] =>
  Array.isArray(value) ? (value as T[]) : [];

const sectionTitle: Record<CvLabSection, string> = {
  summary: "Profil",
  experiences: "Expériences",
  skills: "Compétences",
  projects: "Projets",
  education: "Formation",
  languages: "Langues",
  certifications: "Certifications",
};

const renderSummary = (
  profile: RenderableProfile,
  summaryOverride: string | null,
): string => {
  const summary = summaryOverride ?? profile.bio;
  if (!summary) return "";
  return `<p class="paragraph">${escapeHtml(summary)}</p>`;
};

const renderExperiences = (profile: RenderableProfile): string => {
  const experiences = asArray<{
    title?: string;
    company?: string;
    startDate?: string;
    endDate?: string;
    description?: string;
  }>(profile.experiences);

  if (experiences.length === 0) return "";

  return experiences
    .map(
      (experience) => `
        <article class="item">
          <h4>${escapeHtml(experience.title ?? "Expérience")}</h4>
          <p class="meta">
            ${escapeHtml(experience.company ?? "")}
            ${experience.startDate ? ` · ${escapeHtml(experience.startDate)}` : ""}
            ${experience.endDate ? ` - ${escapeHtml(experience.endDate)}` : ""}
          </p>
          ${experience.description ? `<p class="paragraph">${escapeHtml(experience.description)}</p>` : ""}
        </article>
      `,
    )
    .join("");
};

const renderSkills = (profile: RenderableProfile): string => {
  const skills = asArray<{ name?: string; level?: string }>(profile.skills);
  if (skills.length === 0) return "";

  return `<div class="badges">
    ${skills
      .map(
        (skill) =>
          `<span class="badge">${escapeHtml(skill.name ?? "Compétence")}${
            skill.level ? `<small>${escapeHtml(skill.level)}</small>` : ""
          }</span>`,
      )
      .join("")}
  </div>`;
};

const renderProjects = (profile: RenderableProfile): string => {
  const projects = asArray<{
    name?: string;
    description?: string;
    url?: string;
  }>(profile.projects);
  if (projects.length === 0) return "";

  return projects
    .map(
      (project) => `
      <article class="item">
        <h4>${escapeHtml(project.name ?? "Projet")}</h4>
        ${
          project.url
            ? `<p class="meta"><a href="${escapeHtml(project.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(project.url)}</a></p>`
            : ""
        }
        ${
          project.description
            ? `<p class="paragraph">${escapeHtml(project.description)}</p>`
            : ""
        }
      </article>
    `,
    )
    .join("");
};

const renderEducation = (profile: RenderableProfile): string => {
  const education = asArray<{
    degree?: string;
    school?: string;
    startDate?: string;
    endDate?: string;
    year?: string;
  }>(profile.education);
  if (education.length === 0) return "";

  return education
    .map(
      (entry) => `
      <article class="item">
        <h4>${escapeHtml(entry.degree ?? "Diplôme")}</h4>
        <p class="meta">
          ${escapeHtml(entry.school ?? "")}
          ${entry.startDate ? ` · ${escapeHtml(entry.startDate)}` : ""}
          ${entry.endDate ? ` - ${escapeHtml(entry.endDate)}` : ""}
          ${entry.year ? ` · ${escapeHtml(entry.year)}` : ""}
        </p>
      </article>
    `,
    )
    .join("");
};

const renderLanguages = (profile: RenderableProfile): string => {
  const languages = asArray<{ name?: string; level?: string }>(
    profile.languages,
  );
  if (languages.length === 0) return "";

  return `<ul class="list">
    ${languages
      .map(
        (language) =>
          `<li>${escapeHtml(language.name ?? "Langue")}${
            language.level ? ` · ${escapeHtml(language.level)}` : ""
          }</li>`,
      )
      .join("")}
  </ul>`;
};

const renderCertifications = (profile: RenderableProfile): string => {
  const certifications = asArray<{
    name?: string;
    issuer?: string;
    issueDate?: string;
  }>(profile.certifications);
  if (certifications.length === 0) return "";

  return `<ul class="list">
    ${certifications
      .map(
        (certification) =>
          `<li>${escapeHtml(certification.name ?? "Certification")}${
            certification.issuer ? ` · ${escapeHtml(certification.issuer)}` : ""
          }${certification.issueDate ? ` (${escapeHtml(certification.issueDate)})` : ""}</li>`,
      )
      .join("")}
  </ul>`;
};

const renderSection = (
  section: CvLabSection,
  profile: RenderableProfile,
  summaryOverride: string | null,
): string => {
  switch (section) {
    case "summary":
      return renderSummary(profile, summaryOverride);
    case "experiences":
      return renderExperiences(profile);
    case "skills":
      return renderSkills(profile);
    case "projects":
      return renderProjects(profile);
    case "education":
      return renderEducation(profile);
    case "languages":
      return renderLanguages(profile);
    case "certifications":
      return renderCertifications(profile);
    default:
      return "";
  }
};

const sectionShouldBeSidebar = (section: CvLabSection) =>
  ["skills", "languages", "education", "certifications"].includes(section);

type RenderOptions = {
  autoPrint?: boolean;
};

export const renderCvLabHtml = (
  document: RenderableDocument,
  profile: RenderableProfile,
  options?: RenderOptions,
) => {
  const { order, hidden } = normalizeSections(
    document.sectionOrder,
    document.hiddenSections,
  );
  const accentColor = sanitizeHex(document.accentColor);
  const theme = THEMES[document.theme];
  const pageSize = "A4";
  const headline = document.headlineOverride ?? profile.headline;
  const title = document.targetRole
    ? `${document.name} · ${document.targetRole}`
    : document.name;

  const sectionBlocks = order
    .filter((section) => !hidden.has(section))
    .map((section) => {
      const content = renderSection(section, profile, document.summaryOverride);
      if (!content) return "";
      return `
        <section class="section" data-section="${section}">
          <h3>${sectionTitle[section]}</h3>
          ${content}
        </section>
      `;
    })
    .filter(Boolean);

  const isTwoColumn = document.template === "TWO_COLUMN";

  const mainContent = isTwoColumn
    ? sectionBlocks
        .filter((block) => {
          const section = /data-section="([^"]+)"/.exec(block)?.[1] as
            | CvLabSection
            | undefined;
          return section ? !sectionShouldBeSidebar(section) : true;
        })
        .join("")
    : sectionBlocks.join("");

  const sidebarContent = isTwoColumn
    ? sectionBlocks
        .filter((block) => {
          const section = /data-section="([^"]+)"/.exec(block)?.[1] as
            | CvLabSection
            | undefined;
          return section ? sectionShouldBeSidebar(section) : false;
        })
        .join("")
    : "";

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <style>
    :root {
      --accent: ${accentColor};
      --bg: ${theme.bg};
      --text: ${theme.text};
      --muted: ${theme.muted};
      --surface: ${theme.surface};
    }
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      background: var(--bg);
      color: var(--text);
      font-family: "${escapeHtml(document.fontFamily)}", "Inter", "Segoe UI", sans-serif;
      line-height: 1.5;
    }
    @page {
      size: ${pageSize};
      margin: 1.25cm;
    }
    body {
      padding: 28px;
    }
    .cv {
      max-width: 920px;
      margin: 0 auto;
      border: 1px solid color-mix(in srgb, var(--muted) 18%, transparent);
      border-radius: 16px;
      overflow: hidden;
      background: var(--surface);
    }
    .header {
      padding: 28px;
      border-bottom: 1px solid color-mix(in srgb, var(--muted) 18%, transparent);
      background:
        linear-gradient(120deg, color-mix(in srgb, var(--accent) 12%, var(--surface)) 0%, var(--surface) 48%);
    }
    .header h1 {
      margin: 0;
      font-size: 34px;
      line-height: 1.1;
      letter-spacing: -0.03em;
    }
    .header h2 {
      margin: 6px 0 0 0;
      color: var(--muted);
      font-size: 20px;
      font-weight: 500;
    }
    .meta-line {
      margin-top: 14px;
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      color: var(--muted);
      font-size: 13px;
    }
    .chip {
      display: inline-flex;
      border: 1px solid color-mix(in srgb, var(--accent) 35%, transparent);
      border-radius: 999px;
      padding: 2px 10px;
      color: color-mix(in srgb, var(--accent) 70%, var(--text));
      font-size: 12px;
      font-weight: 600;
      align-items: center;
    }
    .content {
      padding: 24px 28px 28px;
      display: grid;
      gap: 16px;
      ${
        isTwoColumn
          ? "grid-template-columns: minmax(0, 2fr) minmax(240px, 0.9fr);"
          : "grid-template-columns: minmax(0, 1fr);"
      }
    }
    .main, .sidebar {
      display: grid;
      gap: 14px;
      align-content: start;
    }
    .section {
      border: 1px solid color-mix(in srgb, var(--muted) 14%, transparent);
      background: color-mix(in srgb, var(--surface) 95%, white);
      border-radius: 12px;
      padding: 14px 16px;
      break-inside: avoid;
      page-break-inside: avoid;
      -webkit-column-break-inside: avoid;
    }
    .section h3 {
      margin: 0 0 10px 0;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: color-mix(in srgb, var(--accent) 74%, var(--text));
    }
    .item + .item {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px dashed color-mix(in srgb, var(--muted) 22%, transparent);
    }
    .item {
      break-inside: avoid;
      page-break-inside: avoid;
      -webkit-column-break-inside: avoid;
    }
    .item h4 {
      margin: 0;
      font-size: 15px;
      font-weight: 600;
    }
    .meta {
      margin: 4px 0 0 0;
      font-size: 12px;
      color: var(--muted);
    }
    .meta a {
      color: var(--accent);
      text-decoration: none;
      word-break: break-word;
    }
    .paragraph {
      margin: 8px 0 0 0;
      font-size: 13px;
      color: var(--text);
      white-space: pre-wrap;
      orphans: 3;
      widows: 3;
    }
    .list {
      margin: 0;
      padding-left: 18px;
      font-size: 13px;
      display: grid;
      gap: 5px;
    }
    .badges {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .badge {
      display: inline-flex;
      gap: 6px;
      border-radius: 999px;
      border: 1px solid color-mix(in srgb, var(--accent) 35%, transparent);
      padding: 5px 10px;
      font-size: 12px;
      line-height: 1;
      color: color-mix(in srgb, var(--accent) 76%, var(--text));
      background: color-mix(in srgb, var(--accent) 8%, transparent);
    }
    .badge small {
      color: var(--muted);
    }
    @media (max-width: 960px) {
      body {
        padding: 0;
      }
      .cv {
        border-radius: 0;
        border: none;
      }
      .content {
        grid-template-columns: 1fr;
      }
    }
    @media print {
      body {
        padding: 0;
      }
      .cv {
        border: none;
        border-radius: 0;
        max-width: 100%;
      }
      .section {
        break-inside: avoid;
        page-break-inside: avoid;
      }
      .item {
        break-inside: avoid;
        page-break-inside: avoid;
      }
      a[href]:after {
        content: "";
      }
    }
  </style>
</head>
<body>
  <div class="cv">
    <header class="header">
      <h1>${escapeHtml(profile.name)}</h1>
      <h2>${escapeHtml(headline)}</h2>
      <div class="meta-line">
        ${document.targetRole ? `<span class="chip">${escapeHtml(document.targetRole)}</span>` : ""}
        ${profile.zone ? `<span>${escapeHtml(profile.zone)}</span>` : ""}
        ${profile.tjmTarget ? `<span>TJM ${escapeHtml(String(profile.tjmTarget))}€</span>` : ""}
        <span>CV ${escapeHtml(document.name)}</span>
      </div>
    </header>
    <div class="content">
      <main class="main">
        ${mainContent}
      </main>
      ${isTwoColumn ? `<aside class="sidebar">${sidebarContent}</aside>` : ""}
    </div>
  </div>
  <style>
    [data-section]:hover, .header:hover {
      outline: 2px solid rgba(59, 130, 246, 0.5);
      outline-offset: 2px;
      cursor: pointer;
      border-radius: 4px;
    }
  </style>
  <script>
    document.addEventListener('click', function(e) {
      var section = e.target.closest('[data-section]');
      var header = e.target.closest('.header');
      var target = section ? section.dataset.section : (header ? 'header' : null);
      if (target && window.parent !== window) {
        window.parent.postMessage({ type: 'cv-section-click', section: target }, '*');
      }
    });
  </script>
  ${
    options?.autoPrint
      ? `<script>
      window.addEventListener("load", () => {
        setTimeout(() => window.print(), 220);
      });
    </script>`
      : ""
  }
</body>
</html>`;
};
