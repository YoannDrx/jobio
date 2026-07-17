import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import type { ResolvedCvContent } from "@/features/cv-lab/cv-content-resolver";
import { generateCvPdfBuffer } from "@/features/cv-lab/cv-pdf";
import { renderCvLabHtml } from "@/features/cv-lab/cv-renderer";

type RenderableDocument = Parameters<typeof renderCvLabHtml>[0];

const outputDirectory = path.resolve("tmp/pdfs");

const longDescription = [
  "Pilotage d'un produit SaaS de la découverte à la mise en production.",
  "Architecture Next.js, TypeScript et PostgreSQL avec contrôles d'accès serveur.",
  "Mise en place des tests, de l'observabilité et d'un processus de livraison reproductible.",
].join("\n");

const content: ResolvedCvContent = {
  fullName: "Ada Lovelace",
  headline: "Développeuse produit React / Next.js",
  summary:
    "Développeuse produit attentive à la qualité, à l'accessibilité et aux résultats métier. Je transforme des problèmes ambigus en parcours fiables, mesurables et maintenables.",
  email: "ada@example.com",
  phone: "+33 6 12 34 56 78",
  city: "Paris",
  photoUrl: null,
  hobbies: ["Course à pied", "Transmission", "Cuisine"],
  driverLicenses: ["Permis B"],
  socialLinks: {
    linkedinUrl: "https://linkedin.com/in/ada-lovelace",
    githubUrl: "https://github.com/ada-lovelace",
    websiteUrl: "https://example.com/portfolio/ada-lovelace-product-engineer",
  },
  skills: Array.from({ length: 24 }, (_, index) => ({
    id: `skill-${index}`,
    name: `Compétence produit ${index + 1}`,
    level: index % 3 === 0 ? "expert" : "advanced",
  })),
  experiences: Array.from({ length: 9 }, (_, index) => ({
    id: `experience-${index}`,
    title: index === 0 ? "Lead Product Engineer" : "Product Engineer",
    company: `Entreprise ${index + 1}`,
    startDate: `${2016 + index}-01`,
    endDate: `${2017 + index}-12`,
    description: longDescription,
    technologies: ["React", "Next.js", "TypeScript", "PostgreSQL"],
  })),
  education: Array.from({ length: 3 }, (_, index) => ({
    id: `education-${index}`,
    degree: `Diplôme produit ${index + 1}`,
    institution: `Établissement ${index + 1}`,
    startDate: `${2012 + index}-09`,
    endDate: `${2013 + index}-06`,
  })),
  certifications: Array.from({ length: 4 }, (_, index) => ({
    id: `certification-${index}`,
    name: `Certification ${index + 1}`,
    issuer: "Organisme vérifié",
  })),
  languages: [
    { id: "language-fr", name: "Français", level: "Langue maternelle" },
    { id: "language-en", name: "Anglais", level: "Professionnel" },
  ],
  projects: Array.from({ length: 5 }, (_, index) => ({
    id: `project-${index}`,
    name: `Produit ${index + 1}`,
    description: longDescription,
    technologies: ["React", "PostgreSQL"],
    url: `https://example.com/projects/${index + 1}`,
  })),
};

const baseDocument: RenderableDocument = {
  name: "CV long de validation",
  targetRole: "Senior Product Engineer",
  template: "CLASSIC",
  theme: "MODERN",
  pageSize: "A4",
  accentColor: "#3B5CCC",
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
};

const variants: { name: string; document: RenderableDocument }[] = [
  { name: "classic", document: baseDocument },
  {
    name: "two-column",
    document: { ...baseDocument, template: "TWO_COLUMN" },
  },
];

async function main() {
  await mkdir(outputDirectory, { recursive: true });

  const outputPaths = await Promise.all(
    variants.map(async (variant) => {
      const html = renderCvLabHtml(variant.document, content);
      const pdf = await generateCvPdfBuffer(html);
      const outputPath = path.join(
        outputDirectory,
        `jobio-cv-long-${variant.name}.pdf`,
      );
      await writeFile(outputPath, pdf);
      return outputPath;
    }),
  );

  process.stdout.write(`${outputPaths.join("\n")}\n`);
}

void main();
