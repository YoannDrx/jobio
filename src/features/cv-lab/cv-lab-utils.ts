import { z } from "zod";
import {
  CV_LAB_PAGE_SIZES,
  CV_LAB_SECTIONS,
  CV_LAB_TEMPLATES,
  CV_LAB_THEMES,
  type CvLabPageSize,
  type CvLabSection,
  type CvLabTemplate,
  type CvLabTheme,
} from "./cv-lab.schema";

export type CvProfile = {
  id: string;
  name: string;
  headline: string;
  bio: string | null;
  experiences: unknown;
  skills: unknown;
  education: unknown;
  projects: unknown;
  languages: unknown;
  certifications: unknown;
};

export type CvDocument = {
  id: string;
  profileId: string;
  name: string;
  targetRole: string | null;
  template: CvLabTemplate;
  theme: CvLabTheme;
  pageSize: CvLabPageSize;
  accentColor: string;
  fontFamily: string;
  headlineOverride: string | null;
  summaryOverride: string | null;
  sectionOrder: CvLabSection[];
  hiddenSections: CvLabSection[];
  masterCvId?: string | null;
  contentOverrides?: unknown;
  hiddenItems?: unknown;
  personalInfo?: unknown;
  shareToken: string | null;
  coachSessionId: string | null;
  updatedAt: string | Date;
  archivedAt: string | Date | null;
  profile: CvProfile;
  _count: {
    versions: number;
  };
};

export type CvVersion = {
  id: string;
  label: string;
  createdAt: string | Date;
  snapshot: Draft | null;
  snapshotRaw: unknown;
};

export type Draft = {
  profileId: string;
  name: string;
  targetRole: string;
  template: CvLabTemplate;
  theme: CvLabTheme;
  pageSize: CvLabPageSize;
  accentColor: string;
  fontFamily: string;
  headlineOverride: string;
  summaryOverride: string;
  sectionOrder: CvLabSection[];
  hiddenSections: CvLabSection[];
};

export type CvLabRenderSnapshot = {
  profileId: string;
  name: string;
  targetRole: string | null;
  template: CvLabTemplate;
  theme: CvLabTheme;
  pageSize: CvLabPageSize;
  accentColor: string;
  fontFamily: string;
  headlineOverride: string | null;
  summaryOverride: string | null;
  sectionOrder: CvLabSection[];
  hiddenSections: CvLabSection[];
};

export type AtsAnalysis = {
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

export type DraftDiffItem = {
  id: string;
  label: string;
  before: string;
  after: string;
};

export type SectionLineSnapshot = {
  summaryLines: string[];
  experienceLines: string[];
};

export type SectionLineDiff = {
  sectionId: "summary" | "experiences";
  sectionLabel: string;
  addedLines: string[];
  removedLines: string[];
};

export type AtsSuggestionPreview = {
  draft: Draft;
  changeNotes: string[];
  diffItems: DraftDiffItem[];
};

export const SECTION_LABELS: Record<CvLabSection, string> = {
  summary: "Résumé",
  experiences: "Expériences",
  skills: "Compétences",
  projects: "Projets",
  education: "Formation",
  languages: "Langues",
  certifications: "Certifications",
};

export const CV_LAB_LOCAL_DRAFT_STORAGE_PREFIX = "jobio.cv-lab.local-draft.v1";
export const CV_LAB_VERSION_COMPARE_CURRENT = "__current_draft__";

export const toDate = (value: string | Date) => new Date(value);

export const buildDraft = (document: CvDocument): Draft => ({
  profileId: document.profileId,
  name: document.name,
  targetRole: document.targetRole ?? "",
  template: document.template,
  theme: document.theme,
  pageSize: "A4",
  accentColor: document.accentColor,
  fontFamily: document.fontFamily,
  headlineOverride: document.headlineOverride ?? "",
  summaryOverride: document.summaryOverride ?? "",
  sectionOrder:
    document.sectionOrder.length > 0
      ? [...document.sectionOrder]
      : [...CV_LAB_SECTIONS],
  hiddenSections: [...document.hiddenSections],
});

export const buildRenderSnapshot = (draft: Draft): CvLabRenderSnapshot => ({
  profileId: draft.profileId,
  name: draft.name,
  targetRole: draft.targetRole || null,
  template: draft.template,
  theme: draft.theme,
  pageSize: "A4",
  accentColor: draft.accentColor,
  fontFamily: draft.fontFamily,
  headlineOverride: draft.headlineOverride || null,
  summaryOverride: draft.summaryOverride || null,
  sectionOrder: draft.sectionOrder,
  hiddenSections: draft.hiddenSections,
});

export const getFilenameFromDisposition = (header: string | null) => {
  if (!header) return "cv.pdf";

  const match = header.match(/filename="?([^"]+)"?/i);
  if (!match?.[1]) return "cv.pdf";
  return match[1];
};

export const cvLabSnapshotImportSchema = z.object({
  profileId: z.string().min(1).optional(),
  name: z.string().trim().min(2).max(80),
  targetRole: z.string().trim().max(120).nullable().optional(),
  template: z.enum(CV_LAB_TEMPLATES),
  theme: z.enum(CV_LAB_THEMES),
  pageSize: z.enum(CV_LAB_PAGE_SIZES),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  fontFamily: z.string().trim().min(2).max(40),
  headlineOverride: z.string().trim().max(180).nullable().optional(),
  summaryOverride: z.string().trim().max(1400).nullable().optional(),
  sectionOrder: z.array(z.enum(CV_LAB_SECTIONS)).default([...CV_LAB_SECTIONS]),
  hiddenSections: z.array(z.enum(CV_LAB_SECTIONS)).default([]),
});

export const cvLabImportPayloadSchema = z.union([
  z.object({
    version: z.number().int().positive().optional(),
    exportedAt: z.string().optional(),
    snapshot: cvLabSnapshotImportSchema,
  }),
  cvLabSnapshotImportSchema,
]);

export const cvLabLocalDraftPayloadSchema = z.object({
  version: z.literal(1),
  documentId: z.string().min(1),
  savedAt: z.string().datetime(),
  draft: z.object({
    profileId: z.string().min(1),
    name: z.string().trim().min(2).max(80),
    targetRole: z.string(),
    template: z.enum(CV_LAB_TEMPLATES),
    theme: z.enum(CV_LAB_THEMES),
    pageSize: z.enum(CV_LAB_PAGE_SIZES),
    accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    fontFamily: z.string().trim().min(2).max(40),
    headlineOverride: z.string(),
    summaryOverride: z.string(),
    sectionOrder: z.array(z.enum(CV_LAB_SECTIONS)),
    hiddenSections: z.array(z.enum(CV_LAB_SECTIONS)),
  }),
});

export const cvLabVersionSnapshotSchema = z.object({
  profileId: z.string().min(1),
  name: z.string().trim().min(2).max(80),
  targetRole: z.string().trim().max(120).nullable().optional(),
  template: z.enum(CV_LAB_TEMPLATES),
  theme: z.enum(CV_LAB_THEMES),
  pageSize: z.enum(CV_LAB_PAGE_SIZES),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  fontFamily: z.string().trim().min(2).max(40),
  headlineOverride: z.string().trim().max(180).nullable().optional(),
  summaryOverride: z.string().trim().max(1400).nullable().optional(),
  sectionOrder: z.array(z.enum(CV_LAB_SECTIONS)),
  hiddenSections: z.array(z.enum(CV_LAB_SECTIONS)),
  profileSnapshot: z
    .object({
      summaryText: z.string().nullable().optional(),
      experienceLines: z.array(z.string()).optional(),
    })
    .optional(),
});

export const normalizeSectionOrder = (sections: CvLabSection[]) => {
  const unique = Array.from(new Set(sections));
  const valid = unique.filter((section): section is CvLabSection =>
    CV_LAB_SECTIONS.includes(section),
  );
  const remaining = CV_LAB_SECTIONS.filter(
    (section) => !valid.includes(section),
  );
  return [...valid, ...remaining];
};

export const normalizeHiddenSections = (sections: CvLabSection[]) =>
  Array.from(
    new Set(
      sections.filter((section): section is CvLabSection =>
        CV_LAB_SECTIONS.includes(section),
      ),
    ),
  );

export const normalizeDraft = (draft: Draft): Draft => ({
  ...draft,
  pageSize: "A4",
  sectionOrder: normalizeSectionOrder(draft.sectionOrder),
  hiddenSections: normalizeHiddenSections(draft.hiddenSections),
});

export const areDraftsEqual = (left: Draft, right: Draft) =>
  JSON.stringify(normalizeDraft(left)) ===
  JSON.stringify(normalizeDraft(right));

export const getLocalDraftStorageKey = (documentId: string) =>
  `${CV_LAB_LOCAL_DRAFT_STORAGE_PREFIX}:${documentId}`;

export const parseDraftFromVersionSnapshot = (value: unknown): Draft | null => {
  const parsed = cvLabVersionSnapshotSchema.safeParse(value);
  if (!parsed.success) {
    return null;
  }

  return normalizeDraft({
    profileId: parsed.data.profileId,
    name: parsed.data.name,
    targetRole: parsed.data.targetRole ?? "",
    template: parsed.data.template,
    theme: parsed.data.theme,
    pageSize: "A4",
    accentColor: parsed.data.accentColor,
    fontFamily: parsed.data.fontFamily,
    headlineOverride: parsed.data.headlineOverride ?? "",
    summaryOverride: parsed.data.summaryOverride ?? "",
    sectionOrder: parsed.data.sectionOrder,
    hiddenSections: parsed.data.hiddenSections,
  });
};

const summarizeDiffValue = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "—";
  if (trimmed.length <= 140) return trimmed;
  return `${trimmed.slice(0, 137)}...`;
};

export const buildDraftDiffItems = (
  before: Draft,
  after: Draft,
): DraftDiffItem[] => {
  const changes: DraftDiffItem[] = [];

  const push = (id: string, label: string, previous: string, next: string) => {
    if (previous === next) return;
    changes.push({
      id,
      label,
      before: summarizeDiffValue(previous),
      after: summarizeDiffValue(next),
    });
  };

  push("name", "Nom du CV", before.name, after.name);
  push("target_role", "Poste ciblé", before.targetRole, after.targetRole);
  push("profile_id", "Profil source (ID)", before.profileId, after.profileId);
  push("template", "Template", before.template, after.template);
  push("theme", "Thème", before.theme, after.theme);
  push("accent_color", "Couleur accent", before.accentColor, after.accentColor);
  push("font_family", "Police", before.fontFamily, after.fontFamily);
  push(
    "headline_override",
    "Titre personnalisé",
    before.headlineOverride,
    after.headlineOverride,
  );
  push(
    "summary_override",
    "Résumé personnalisé",
    before.summaryOverride,
    after.summaryOverride,
  );
  push(
    "section_order",
    "Ordre des sections",
    before.sectionOrder.join(" > "),
    after.sectionOrder.join(" > "),
  );
  push(
    "hidden_sections",
    "Sections masquées",
    before.hiddenSections.join(", "),
    after.hiddenSections.join(", "),
  );

  return changes;
};

const normalizeSectionLabelKey = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const SECTION_LABEL_TO_KEY: Partial<Record<string, CvLabSection>> =
  Object.entries({
    ...SECTION_LABELS,
    summaryAlt: "Resume",
    experiencesAlt: "Experiences",
    skillsAlt: "Competences",
    summaryEn: "Summary",
    experiencesEn: "Experience",
    skillsEn: "Skills",
    projectsEn: "Projects",
    educationEn: "Education",
    languagesEn: "Languages",
    certificationsEn: "Certifications",
  }).reduce(
    (acc, [key, label]) => {
      const normalizedLabel = normalizeSectionLabelKey(label);
      const sectionKey = key.replace(/(Alt|En)$/, "") as CvLabSection;
      acc[normalizedLabel] = sectionKey;
      return acc;
    },
    {} as Partial<Record<string, CvLabSection>>,
  );

const getTextLines = (value: string): string[] => {
  const trimmed = value.trim();
  if (!trimmed) return [];

  const hasLineBreak = trimmed.includes("\n");
  const chunks = hasLineBreak
    ? trimmed.split(/\r?\n+/g)
    : trimmed.split(/[.!?]\s+/g);

  return chunks
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .slice(0, 50);
};

const normalizeLineKey = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const getExperienceLinesFromUnknown = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== "object") return "";
      const data = item as Record<string, unknown>;
      const title = typeof data.title === "string" ? data.title.trim() : "";
      const company =
        typeof data.company === "string" ? data.company.trim() : "";
      const description =
        typeof data.description === "string" ? data.description.trim() : "";

      const headline = [title, company].filter(Boolean).join(" · ");
      if (headline && description) {
        return `${headline} — ${description}`;
      }
      return headline || description;
    })
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .slice(0, 80);
};

export const buildSectionLineSnapshotFromDraft = (params: {
  draft: Draft;
  profileById: Map<string, CvProfile>;
  versionSnapshotRaw?: unknown;
}): SectionLineSnapshot => {
  const parsedSnapshot = params.versionSnapshotRaw
    ? cvLabVersionSnapshotSchema.safeParse(params.versionSnapshotRaw)
    : null;

  if (parsedSnapshot?.success && parsedSnapshot.data.profileSnapshot) {
    const summaryLines = getTextLines(
      parsedSnapshot.data.profileSnapshot.summaryText ?? "",
    );
    const experienceLines = (
      parsedSnapshot.data.profileSnapshot.experienceLines ?? []
    )
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .slice(0, 80);

    if (summaryLines.length > 0 || experienceLines.length > 0) {
      return {
        summaryLines,
        experienceLines,
      };
    }
  }

  const profile = params.profileById.get(params.draft.profileId);
  const summarySource =
    params.draft.summaryOverride.trim().length > 0
      ? params.draft.summaryOverride
      : (profile?.bio ?? "");

  return {
    summaryLines: getTextLines(summarySource),
    experienceLines: getExperienceLinesFromUnknown(profile?.experiences),
  };
};

export const buildSectionLineDiffs = (
  before: SectionLineSnapshot,
  after: SectionLineSnapshot,
): SectionLineDiff[] => {
  const compare = (
    sectionId: "summary" | "experiences",
    sectionLabel: string,
    previous: string[],
    next: string[],
  ): SectionLineDiff | null => {
    const previousMap = new Map(
      previous.map((line) => [normalizeLineKey(line), line]),
    );
    const nextMap = new Map(next.map((line) => [normalizeLineKey(line), line]));

    const removedLines = previous
      .filter((line) => !nextMap.has(normalizeLineKey(line)))
      .slice(0, 6);
    const addedLines = next
      .filter((line) => !previousMap.has(normalizeLineKey(line)))
      .slice(0, 6);

    if (removedLines.length === 0 && addedLines.length === 0) {
      return null;
    }

    return {
      sectionId,
      sectionLabel,
      addedLines,
      removedLines,
    };
  };

  const summaryDiff = compare(
    "summary",
    "Résumé",
    before.summaryLines,
    after.summaryLines,
  );
  const experiencesDiff = compare(
    "experiences",
    "Expériences",
    before.experienceLines,
    after.experienceLines,
  );

  return [summaryDiff, experiencesDiff].filter(
    (item): item is SectionLineDiff => Boolean(item),
  );
};

export const buildAtsSuggestionPreview = (params: {
  draft: Draft;
  analysis: AtsAnalysis;
  jobDescription: string;
}): AtsSuggestionPreview => {
  let nextDraft = normalizeDraft({
    ...params.draft,
  });
  const notes: string[] = [];

  if (!nextDraft.targetRole.trim()) {
    const suggestion = params.jobDescription
      .split(/\r?\n/g)
      .map((line) => line.trim())
      .find((line) => line.length >= 6);

    if (suggestion) {
      nextDraft = {
        ...nextDraft,
        targetRole: suggestion.slice(0, 120),
      };
      notes.push("Définition automatique d'un poste ciblé depuis l'offre.");
    }
  }

  const recommendedVisibleSections = new Set<CvLabSection>();
  for (const label of [
    ...params.analysis.details.missingSections,
    ...params.analysis.details.hiddenSections,
  ]) {
    const key = SECTION_LABEL_TO_KEY[normalizeSectionLabelKey(label)];
    if (key) {
      recommendedVisibleSections.add(key);
    }
  }

  const nextHiddenSections = nextDraft.hiddenSections.filter(
    (section) => !recommendedVisibleSections.has(section),
  );
  if (nextHiddenSections.length !== nextDraft.hiddenSections.length) {
    nextDraft = {
      ...nextDraft,
      hiddenSections: nextHiddenSections,
    };
    notes.push(
      "Réactivation des sections manquantes/masquées détectées par l'ATS.",
    );
  }

  const missingKeywords = params.analysis.keywordMetrics.missingKeywords.slice(
    0,
    6,
  );
  if (missingKeywords.length > 0) {
    const keywordLine = `Mots-clés ciblés: ${missingKeywords.join(", ")}.`;
    if (
      !nextDraft.summaryOverride
        .toLowerCase()
        .includes(missingKeywords[0].toLowerCase())
    ) {
      const separator =
        nextDraft.summaryOverride.trim().length > 0 ? "\n\n" : "";
      nextDraft = {
        ...nextDraft,
        summaryOverride:
          `${nextDraft.summaryOverride}${separator}${keywordLine}`.trim(),
      };
      notes.push("Ajout d'une ligne de mots-clés prioritaires dans le résumé.");
    }
  }

  if (params.analysis.details.quantifiableStatements < 2) {
    const quantLine =
      "Impact chiffré à compléter: +X% conversion, -Y% coûts, Z projets livrés.";
    if (!nextDraft.summaryOverride.includes("Impact chiffré à compléter")) {
      const separator =
        nextDraft.summaryOverride.trim().length > 0 ? "\n\n" : "";
      nextDraft = {
        ...nextDraft,
        summaryOverride:
          `${nextDraft.summaryOverride}${separator}${quantLine}`.trim(),
      };
      notes.push("Ajout d'un rappel pour inclure des réalisations chiffrées.");
    }
  }

  const diffItems = buildDraftDiffItems(params.draft, nextDraft);

  return {
    draft: nextDraft,
    changeNotes: notes,
    diffItems,
  };
};
