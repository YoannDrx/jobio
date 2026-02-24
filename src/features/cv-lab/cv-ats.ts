import type { CvLabDocument } from "@/generated/prisma";
import { CV_LAB_SECTIONS, type CvLabSection } from "./cv-lab.schema";
import type { ResolvedCvContent } from "./cv-content-resolver";

type AtsDocument = Pick<
  CvLabDocument,
  | "name"
  | "targetRole"
  | "headlineOverride"
  | "summaryOverride"
  | "sectionOrder"
  | "hiddenSections"
>;

type SectionKey = CvLabSection | "header";

type SectionPresence = Record<SectionKey, boolean>;

const SECTION_LABELS: Record<CvLabSection, string> = {
  summary: "Resume",
  experiences: "Experiences",
  skills: "Competences",
  projects: "Projets",
  education: "Formation",
  languages: "Langues",
  certifications: "Certifications",
};

const SECTION_WEIGHTS: Record<SectionKey, number> = {
  header: 10,
  summary: 15,
  experiences: 30,
  skills: 20,
  projects: 10,
  education: 8,
  languages: 4,
  certifications: 3,
};

const ACTION_VERBS = [
  "led",
  "built",
  "developed",
  "launched",
  "improved",
  "optimized",
  "designed",
  "managed",
  "automated",
  "delivered",
  "created",
  "implemented",
  "resolved",
  "scaled",
  "achieved",
  "deployed",
  "migrated",
  "coordonne",
  "pilote",
  "cree",
  "deploie",
  "ameliore",
  "optimise",
  "genere",
  "transforme",
  "construit",
  "analyse",
  "realise",
  "accompagne",
];

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "in",
  "is",
  "it",
  "of",
  "on",
  "or",
  "the",
  "to",
  "with",
  "that",
  "this",
  "your",
  "you",
  "about",
  "into",
  "after",
  "before",
  "we",
  "our",
  "their",
  "de",
  "des",
  "du",
  "la",
  "le",
  "les",
  "et",
  "ou",
  "pour",
  "dans",
  "avec",
  "sur",
  "sans",
  "aux",
  "une",
  "un",
  "dun",
  "dune",
  "son",
  "ses",
  "vos",
  "votre",
  "notre",
  "nous",
  "vous",
  "ainsi",
  "plus",
  "moins",
  "tres",
  "tout",
  "toute",
  "entre",
  "par",
  "job",
  "poste",
  "role",
  "mission",
  "experience",
  "experiences",
  "profil",
]);

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9+#./\-\s]/g, " ");

const tokenize = (value: string): string[] =>
  normalizeText(value)
    .split(/[\s,;:!?()[\]{}"'`<>|\\/\n\r\t]+/g)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3 && !STOP_WORDS.has(token));

const extractKeywords = (value: string, limit: number): string[] => {
  const frequency = new Map<string, number>();
  for (const token of tokenize(value)) {
    const count = frequency.get(token) ?? 0;
    frequency.set(token, count + 1);
  }

  return [...frequency.entries()]
    .sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return a[0].localeCompare(b[0]);
    })
    .slice(0, limit)
    .map(([keyword]) => keyword);
};

const toReadableSection = (section: CvLabSection) => SECTION_LABELS[section];

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
            (value, index, list) => list.indexOf(value) === index,
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

const getSectionPresence = (
  content: ResolvedCvContent,
  document: AtsDocument,
): SectionPresence => {
  return {
    header: Boolean(
      content.fullName && (document.headlineOverride ?? content.headline),
    ),
    summary: Boolean(document.summaryOverride ?? content.summary),
    experiences: content.experiences.length > 0,
    skills: content.skills.length > 0,
    projects: content.projects.length > 0,
    education: content.education.length > 0,
    languages: content.languages.length > 0,
    certifications: content.certifications.length > 0,
  };
};

const getVisibleSectionPresence = (
  presence: SectionPresence,
  hidden: Set<CvLabSection>,
): SectionPresence => ({
  ...presence,
  summary: hidden.has("summary") ? false : presence.summary,
  experiences: hidden.has("experiences") ? false : presence.experiences,
  skills: hidden.has("skills") ? false : presence.skills,
  projects: hidden.has("projects") ? false : presence.projects,
  education: hidden.has("education") ? false : presence.education,
  languages: hidden.has("languages") ? false : presence.languages,
  certifications: hidden.has("certifications")
    ? false
    : presence.certifications,
});

const computeCompletenessScore = (presence: SectionPresence) => {
  const totalWeight = Object.values(SECTION_WEIGHTS).reduce(
    (acc, value) => acc + value,
    0,
  );
  const completedWeight = (Object.keys(SECTION_WEIGHTS) as SectionKey[]).reduce(
    (acc, section) =>
      presence[section] ? acc + SECTION_WEIGHTS[section] : acc,
    0,
  );
  return Math.round((completedWeight / totalWeight) * 100);
};

const safeString = (value: unknown): string =>
  typeof value === "string" ? value : "";

const extractCvSignals = (
  content: ResolvedCvContent,
  document: AtsDocument,
) => {
  const headline = document.headlineOverride ?? content.headline;
  const summary = document.summaryOverride ?? content.summary ?? "";

  const skillText = content.skills
    .map((skill) => [skill.name, safeString(skill.level)].join(" ").trim())
    .join(" ");
  const experienceText = content.experiences
    .map((item) =>
      [
        item.title,
        item.company,
        safeString(item.startDate),
        safeString(item.endDate),
        safeString(item.description),
      ]
        .join(" ")
        .trim(),
    )
    .join(" ");
  const educationText = content.education
    .map((item) =>
      [
        item.degree,
        item.institution,
        safeString(item.field),
        safeString(item.startDate),
        safeString(item.endDate),
      ]
        .join(" ")
        .trim(),
    )
    .join(" ");
  const languageText = content.languages
    .map((item) => [item.name, item.level].join(" ").trim())
    .join(" ");
  const certificationText = content.certifications
    .map((item) =>
      [item.name, safeString(item.issuer), safeString(item.date)]
        .join(" ")
        .trim(),
    )
    .join(" ");
  const projectText = content.projects
    .map((item) =>
      [item.name, safeString(item.description), safeString(item.url)]
        .join(" ")
        .trim(),
    )
    .join(" ");

  const cvText = [
    content.fullName,
    safeString(headline),
    safeString(summary),
    safeString(document.targetRole),
    skillText,
    experienceText,
    educationText,
    languageText,
    certificationText,
    projectText,
  ]
    .join(" ")
    .trim();

  const measurableText = [
    safeString(summary),
    experienceText,
    projectText,
  ].join(" ");
  const quantifiableMatches = measurableText.match(
    /\b\d+(?:[.,]\d+)?\s?(?:%|k|m|x|ans?|mois|jours?|euros?|€|\$)?\b/gi,
  );
  const quantifiableCount = quantifiableMatches
    ? quantifiableMatches.length
    : 0;

  const normalizedMeasurableText = normalizeText(measurableText);
  const verbHits = ACTION_VERBS.reduce(
    (acc, verb) => (normalizedMeasurableText.includes(verb) ? acc + 1 : acc),
    0,
  );

  const sentenceCandidates = measurableText
    .split(/[.!?]\s+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
  const totalWords = tokenize(measurableText).length;
  const averageSentenceLength =
    sentenceCandidates.length > 0
      ? totalWords / sentenceCandidates.length
      : totalWords;

  return {
    cvText,
    summary,
    quantifiableCount,
    verbHits,
    totalWords,
    averageSentenceLength,
  };
};

const computeKeywordScore = (
  targetKeywords: string[],
  cvKeywordsSet: Set<string>,
) => {
  const matched = targetKeywords.filter((keyword) =>
    cvKeywordsSet.has(keyword),
  );
  const missing = targetKeywords.filter(
    (keyword) => !cvKeywordsSet.has(keyword),
  );

  const coverage =
    targetKeywords.length > 0
      ? Math.round((matched.length / targetKeywords.length) * 100)
      : 0;

  return {
    coverage,
    matched,
    missing,
  };
};

const computeImpactScore = (quantifiableCount: number, verbHits: number) => {
  const score =
    25 + Math.min(45, quantifiableCount * 9) + Math.min(30, verbHits * 5);
  return clamp(Math.round(score), 0, 100);
};

const computeReadabilityScore = (
  totalWords: number,
  averageSentenceLength: number,
) => {
  if (totalWords === 0) return 35;

  let score = 90;

  if (totalWords < 70) score -= 20;
  if (averageSentenceLength < 8) score -= 15;
  if (averageSentenceLength > 26) score -= 20;
  if (averageSentenceLength > 34) score -= 10;

  return clamp(Math.round(score), 20, 100);
};

const unique = (values: string[]) =>
  Array.from(new Set(values.filter(Boolean)));

export type CvAtsAnalysis = {
  generatedAt: string;
  overallScore: number;
  scoreBreakdown: {
    completeness: number;
    keywordMatch: number;
    impact: number;
    readability: number;
  };
  keywordMetrics: {
    targetKeywords: string[];
    matchedKeywords: string[];
    missingKeywords: string[];
    coverage: number;
  };
  details: {
    presentSections: string[];
    missingSections: string[];
    hiddenSections: string[];
    quantifiableStatements: number;
  };
  strengths: string[];
  gaps: string[];
  recommendations: string[];
};

type AnalyzeCvAtsInput = {
  content: ResolvedCvContent;
  document: AtsDocument;
  jobDescription?: string | null;
};

export const analyzeCvAts = ({
  content,
  document,
  jobDescription,
}: AnalyzeCvAtsInput): CvAtsAnalysis => {
  const { hidden } = normalizeSections(
    document.sectionOrder,
    document.hiddenSections,
  );

  const rawPresence = getSectionPresence(content, document);
  const presence = getVisibleSectionPresence(rawPresence, hidden);

  const completenessScore = computeCompletenessScore(presence);

  const cvSignals = extractCvSignals(content, document);
  const cvKeywords = extractKeywords(cvSignals.cvText, 160);
  const cvKeywordsSet = new Set(cvKeywords);

  let targetKeywords = extractKeywords(
    [safeString(document.targetRole), safeString(jobDescription)].join(" "),
    30,
  );

  if (targetKeywords.length === 0) {
    targetKeywords = extractKeywords(
      [safeString(document.targetRole), cvSignals.summary].join(" "),
      15,
    );
  }

  const keywordScore = computeKeywordScore(targetKeywords, cvKeywordsSet);
  const impactScore = computeImpactScore(
    cvSignals.quantifiableCount,
    cvSignals.verbHits,
  );
  const readabilityScore = computeReadabilityScore(
    cvSignals.totalWords,
    cvSignals.averageSentenceLength,
  );

  const overallScore = Math.round(
    completenessScore * 0.38 +
      keywordScore.coverage * 0.34 +
      impactScore * 0.18 +
      readabilityScore * 0.1,
  );

  const presentSections = (Object.keys(presence) as SectionKey[])
    .filter((section) => presence[section] && section !== "header")
    .map((section) => toReadableSection(section as CvLabSection));

  const missingSections = (Object.keys(presence) as SectionKey[])
    .filter((section) => !presence[section] && section !== "header")
    .map((section) => toReadableSection(section as CvLabSection));

  const hiddenSections = [...hidden].map((section) =>
    toReadableSection(section),
  );

  const strengths = unique([
    completenessScore >= 80
      ? "Structure globale solide avec sections clefs bien couvertes."
      : "",
    keywordScore.coverage >= 70
      ? "Bon alignement lexical avec le poste cible."
      : "",
    impactScore >= 65
      ? "Le CV met en avant des resultats concrets et actionnables."
      : "",
    readabilityScore >= 75
      ? "Le niveau de lisibilite facilite le scan ATS + recruteur."
      : "",
  ]).slice(0, 4);

  const primaryMissingKeywords = keywordScore.missing.slice(0, 8);

  const gaps = unique([
    targetKeywords.length === 0
      ? "Aucun contexte de poste detecte pour calibrer precisement l'analyse ATS."
      : "",
    missingSections.length > 0
      ? `Sections manquantes ou masquees: ${missingSections.slice(0, 4).join(", ")}.`
      : "",
    primaryMissingKeywords.length > 0
      ? `Mots-cles absents: ${primaryMissingKeywords.join(", ")}.`
      : "",
    cvSignals.quantifiableCount < 2
      ? "Trop peu d'elements chiffres (impact, volume, ROI, progression)."
      : "",
  ]).slice(0, 4);

  const recommendations = unique([
    targetKeywords.length === 0
      ? "Ajoute une fiche de poste ou un role cible pour obtenir un matching ATS pertinent."
      : "",
    primaryMissingKeywords.length > 0
      ? `Integre naturellement ces mots-cles dans le resume, l'experience et les competences: ${primaryMissingKeywords
          .slice(0, 5)
          .join(", ")}.`
      : "",
    missingSections.includes("Competences")
      ? "Ajoute une section Competences explicite avec stack, outils et niveau."
      : "",
    missingSections.includes("Experiences")
      ? "Ajoute des experiences detaillees avec contexte, actions et resultats."
      : "",
    cvSignals.quantifiableCount < 2
      ? "Ajoute 2 a 4 accomplissements chiffres (ex: +32% conversion, -18% cout, 40k utilisateurs)."
      : "",
    readabilityScore < 70
      ? "Raccourcis les phrases longues et structure les blocs en points concis."
      : "",
  ]).slice(0, 6);

  return {
    generatedAt: new Date().toISOString(),
    overallScore,
    scoreBreakdown: {
      completeness: completenessScore,
      keywordMatch: keywordScore.coverage,
      impact: impactScore,
      readability: readabilityScore,
    },
    keywordMetrics: {
      targetKeywords,
      matchedKeywords: keywordScore.matched,
      missingKeywords: keywordScore.missing,
      coverage: keywordScore.coverage,
    },
    details: {
      presentSections,
      missingSections,
      hiddenSections,
      quantifiableStatements: cvSignals.quantifiableCount,
    },
    strengths,
    gaps,
    recommendations,
  };
};
