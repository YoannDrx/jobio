"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Layout,
  LayoutActions,
  LayoutContent,
  LayoutDescription,
  LayoutHeader,
  LayoutTitle,
} from "@/features/page/layout";
import { getProfilesAction } from "@/features/profiles/profiles.action";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { cn } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import {
  analyzeCvLabAtsAction,
  archiveCvLabDocumentAction,
  createCvLabDocumentAction,
  createCvLabVersionAction,
  deleteCvLabDocumentAction,
  duplicateCvLabDocumentAction,
  listCvLabDocumentsAction,
  restoreCvLabDocumentAction,
  listCvLabVersionsAction,
  restoreCvLabVersionAction,
  updateCvLabDocumentAction,
} from "../cv-lab.action";
import {
  CV_LAB_PAGE_SIZES,
  CV_LAB_SECTIONS,
  CV_LAB_TEMPLATES,
  CV_LAB_THEMES,
  type CvLabPageSize,
  type CvLabSection,
  type CvLabTemplate,
  type CvLabTheme,
} from "../cv-lab.schema";
import {
  ArrowDown,
  ArrowUp,
  BarChart3,
  Copy,
  Download,
  Eye,
  FileDown,
  History,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  Upload,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { dialogManager } from "@/features/dialog-manager/dialog-manager";
import { toast } from "sonner";
import { z } from "zod";

type CvProfile = {
  id: string;
  name: string;
  headline: string;
  bio: string | null;
  experiences: unknown;
};

type CvDocument = {
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
  coachSessionId: string | null;
  updatedAt: string | Date;
  archivedAt: string | Date | null;
  profile: CvProfile;
  _count: {
    versions: number;
  };
};

type CvVersion = {
  id: string;
  label: string;
  createdAt: string | Date;
  snapshot: Draft | null;
  snapshotRaw: unknown;
};

type Draft = {
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

type CvLabRenderSnapshot = {
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

type AtsAnalysis = {
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

type DocumentViewFilter = "active" | "all" | "archived";

const FONT_OPTIONS = [
  "Inter",
  "Space Grotesk",
  "IBM Plex Sans",
  "Helvetica",
  "Georgia",
] as const;

const TEMPLATE_LABELS: Record<CvLabTemplate, string> = {
  CLASSIC: "Classique",
  TWO_COLUMN: "2 colonnes",
  EXECUTIVE: "Executive",
  COMPACT: "Compact",
};

const THEME_LABELS: Record<CvLabTheme, string> = {
  MINIMAL: "Minimal",
  MODERN: "Modern",
  CONTRAST: "Contrast",
  BOLD: "Bold",
};

const SECTION_LABELS: Record<CvLabSection, string> = {
  summary: "Résumé",
  experiences: "Expériences",
  skills: "Compétences",
  projects: "Projets",
  education: "Formation",
  languages: "Langues",
  certifications: "Certifications",
};

const toDate = (value: string | Date) => new Date(value);

const getScoreTone = (score: number) => {
  if (score >= 80) return "text-emerald-600";
  if (score >= 60) return "text-amber-600";
  return "text-rose-600";
};

const buildDraft = (document: CvDocument): Draft => ({
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

const buildRenderSnapshot = (draft: Draft): CvLabRenderSnapshot => ({
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

const getFilenameFromDisposition = (header: string | null) => {
  if (!header) return "cv.pdf";

  const match = header.match(/filename="?([^"]+)"?/i);
  if (!match?.[1]) return "cv.pdf";
  return match[1];
};

const cvLabSnapshotImportSchema = z.object({
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

const cvLabImportPayloadSchema = z.union([
  z.object({
    version: z.number().int().positive().optional(),
    exportedAt: z.string().optional(),
    snapshot: cvLabSnapshotImportSchema,
  }),
  cvLabSnapshotImportSchema,
]);

const CV_LAB_LOCAL_DRAFT_STORAGE_PREFIX = "jobio.cv-lab.local-draft.v1";
const CV_LAB_VERSION_COMPARE_CURRENT = "__current_draft__";

const cvLabLocalDraftPayloadSchema = z.object({
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

const cvLabVersionSnapshotSchema = z.object({
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

const normalizeSectionOrder = (sections: CvLabSection[]) => {
  const unique = Array.from(new Set(sections));
  const valid = unique.filter((section): section is CvLabSection =>
    CV_LAB_SECTIONS.includes(section),
  );
  const remaining = CV_LAB_SECTIONS.filter(
    (section) => !valid.includes(section),
  );
  return [...valid, ...remaining];
};

const normalizeHiddenSections = (sections: CvLabSection[]) =>
  Array.from(
    new Set(
      sections.filter((section): section is CvLabSection =>
        CV_LAB_SECTIONS.includes(section),
      ),
    ),
  );

const normalizeDraft = (draft: Draft): Draft => ({
  ...draft,
  pageSize: "A4",
  sectionOrder: normalizeSectionOrder(draft.sectionOrder),
  hiddenSections: normalizeHiddenSections(draft.hiddenSections),
});

const areDraftsEqual = (left: Draft, right: Draft) =>
  JSON.stringify(normalizeDraft(left)) ===
  JSON.stringify(normalizeDraft(right));

const getLocalDraftStorageKey = (documentId: string) =>
  `${CV_LAB_LOCAL_DRAFT_STORAGE_PREFIX}:${documentId}`;

const parseDraftFromVersionSnapshot = (value: unknown): Draft | null => {
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

type DraftDiffItem = {
  id: string;
  label: string;
  before: string;
  after: string;
};

type SectionLineSnapshot = {
  summaryLines: string[];
  experienceLines: string[];
};

type SectionLineDiff = {
  sectionId: "summary" | "experiences";
  sectionLabel: string;
  addedLines: string[];
  removedLines: string[];
};

type AtsSuggestionPreview = {
  draft: Draft;
  changeNotes: string[];
  diffItems: DraftDiffItem[];
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

const buildSectionLineSnapshotFromDraft = (params: {
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

const buildSectionLineDiffs = (
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

const buildAtsSuggestionPreview = (params: {
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

const buildDraftDiffItems = (before: Draft, after: Draft): DraftDiffItem[] => {
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

export function CvLabStudio() {
  const [profiles, setProfiles] = useState<CvProfile[]>([]);
  const [documents, setDocuments] = useState<CvDocument[]>([]);
  const [documentView, setDocumentView] =
    useState<DocumentViewFilter>("active");
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(
    null,
  );
  const [draft, setDraft] = useState<Draft | null>(null);
  const [versions, setVersions] = useState<CvVersion[]>([]);
  const [versionLabel, setVersionLabel] = useState("");
  const [atsJobDescription, setAtsJobDescription] = useState("");
  const [atsAnalysis, setAtsAnalysis] = useState<AtsAnalysis | null>(null);
  const [atsSuggestionPreview, setAtsSuggestionPreview] =
    useState<AtsSuggestionPreview | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [compareLeftVersionId, setCompareLeftVersionId] = useState("");
  const [compareRightReference, setCompareRightReference] = useState(
    CV_LAB_VERSION_COMPARE_CURRENT,
  );
  const [recoverableLocalDraft, setRecoverableLocalDraft] = useState<{
    draft: Draft;
    savedAt: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const importInputRef = useRef<HTMLInputElement | null>(null);

  const selectedDocument = useMemo(
    () =>
      documents.find((document) => document.id === selectedDocumentId) ?? null,
    [documents, selectedDocumentId],
  );

  const refreshVersions = useCallback(async (documentId: string) => {
    const data = await resolveActionResult(
      listCvLabVersionsAction({ documentId, limit: 20 }),
    );
    const mappedVersions = data.map((version) => ({
      id: version.id,
      label: version.label,
      createdAt: version.createdAt,
      snapshot: parseDraftFromVersionSnapshot(version.snapshot),
      snapshotRaw: version.snapshot,
    }));

    setVersions(mappedVersions);
    setCompareLeftVersionId((previous) => {
      if (mappedVersions.some((version) => version.id === previous)) {
        return previous;
      }
      return mappedVersions[0]?.id ?? "";
    });
    setCompareRightReference((previous) => {
      if (previous === CV_LAB_VERSION_COMPARE_CURRENT) {
        return previous;
      }
      if (mappedVersions.some((version) => version.id === previous)) {
        return previous;
      }
      return CV_LAB_VERSION_COMPARE_CURRENT;
    });
  }, []);

  const filterDocumentsByView = useCallback(
    (sourceDocuments: CvDocument[]) => {
      if (documentView === "all") return sourceDocuments;
      if (documentView === "archived") {
        return sourceDocuments.filter((document) =>
          Boolean(document.archivedAt),
        );
      }
      return sourceDocuments.filter((document) => !document.archivedAt);
    },
    [documentView],
  );

  const reloadData = useCallback(
    async (nextSelectedId?: string | null) => {
      const [profileRows, documentRows] = await Promise.all([
        resolveActionResult(getProfilesAction({})),
        resolveActionResult(
          listCvLabDocumentsAction({
            includeArchived: documentView !== "active",
          }),
        ),
      ]);

      const normalizedProfiles = profileRows.map((profile) => ({
        id: profile.id,
        name: profile.name,
        headline: profile.headline,
        bio: profile.bio,
        experiences: profile.experiences,
      }));
      const normalizedDocuments = documentRows as unknown as CvDocument[];
      const visibleDocuments = filterDocumentsByView(normalizedDocuments);

      setProfiles(normalizedProfiles);
      setDocuments(visibleDocuments);

      const fallbackId = visibleDocuments[0]?.id ?? null;
      const candidateId = nextSelectedId ?? selectedDocumentId ?? fallbackId;
      const existingCandidate = visibleDocuments.find(
        (document) => document.id === candidateId,
      );

      const finalSelectedId = existingCandidate?.id ?? fallbackId;
      setSelectedDocumentId(finalSelectedId);

      if (finalSelectedId) {
        const targetDocument = visibleDocuments.find(
          (document) => document.id === finalSelectedId,
        );
        if (targetDocument) {
          setDraft(buildDraft(targetDocument));
          await refreshVersions(finalSelectedId);
        }
      } else {
        setDraft(null);
        setVersions([]);
      }
    },
    [documentView, filterDocumentsByView, refreshVersions, selectedDocumentId],
  );

  useEffect(() => {
    const load = async () => {
      try {
        await reloadData();
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Impossible de charger CV Lab",
        );
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, [reloadData]);

  useEffect(() => {
    if (!selectedDocument) {
      setDraft(null);
      setVersions([]);
      setAtsAnalysis(null);
      setAtsSuggestionPreview(null);
      setAtsJobDescription("");
      setPreviewHtml(null);
      setPreviewError(null);
      setRecoverableLocalDraft(null);
      return;
    }
    const savedDraft = normalizeDraft(buildDraft(selectedDocument));
    setDraft(savedDraft);
    setAtsAnalysis(null);
    setAtsSuggestionPreview(null);
    setAtsJobDescription("");
    setPreviewError(null);
    setRecoverableLocalDraft(null);

    try {
      const payloadRaw = window.localStorage.getItem(
        getLocalDraftStorageKey(selectedDocument.id),
      );
      if (!payloadRaw) {
        void refreshVersions(selectedDocument.id);
        return;
      }

      const parsedPayload = cvLabLocalDraftPayloadSchema.safeParse(
        JSON.parse(payloadRaw),
      );

      if (!parsedPayload.success) {
        window.localStorage.removeItem(
          getLocalDraftStorageKey(selectedDocument.id),
        );
        void refreshVersions(selectedDocument.id);
        return;
      }

      const normalizedLocalDraft = normalizeDraft({
        ...parsedPayload.data.draft,
        pageSize: "A4",
      });

      if (!areDraftsEqual(normalizedLocalDraft, savedDraft)) {
        setRecoverableLocalDraft({
          draft: normalizedLocalDraft,
          savedAt: parsedPayload.data.savedAt,
        });
      }
    } catch {
      // Ignore local storage errors and keep the server draft.
    }

    void refreshVersions(selectedDocument.id);
  }, [refreshVersions, selectedDocument]);

  const hasUnsavedChanges = useMemo(() => {
    if (!selectedDocument || !draft) return false;
    const normalizedSelected = buildDraft(selectedDocument);
    return JSON.stringify(normalizedSelected) !== JSON.stringify(draft);
  }, [selectedDocument, draft]);

  const profileById = useMemo(
    () => new Map(profiles.map((profile) => [profile.id, profile] as const)),
    [profiles],
  );

  const compareLeftVersion = useMemo(
    () =>
      versions.find((version) => version.id === compareLeftVersionId) ?? null,
    [compareLeftVersionId, versions],
  );

  const compareRightVersion = useMemo(() => {
    if (compareRightReference === CV_LAB_VERSION_COMPARE_CURRENT) {
      return null;
    }
    return (
      versions.find((version) => version.id === compareRightReference) ?? null
    );
  }, [compareRightReference, versions]);

  const compareLeftDraft = compareLeftVersion?.snapshot ?? null;
  const compareRightDraft =
    compareRightReference === CV_LAB_VERSION_COMPARE_CURRENT
      ? draft
      : (compareRightVersion?.snapshot ?? null);

  const versionDiffItems = useMemo(() => {
    if (!compareLeftDraft || !compareRightDraft) {
      return [] as DraftDiffItem[];
    }
    if (
      compareRightReference !== CV_LAB_VERSION_COMPARE_CURRENT &&
      compareLeftVersion?.id === compareRightVersion?.id
    ) {
      return [] as DraftDiffItem[];
    }

    return buildDraftDiffItems(compareLeftDraft, compareRightDraft);
  }, [
    compareLeftDraft,
    compareLeftVersion?.id,
    compareRightDraft,
    compareRightReference,
    compareRightVersion?.id,
  ]);

  const compareLeftSectionLines = useMemo(() => {
    if (!compareLeftVersion || !compareLeftDraft) {
      return null;
    }

    return buildSectionLineSnapshotFromDraft({
      draft: compareLeftDraft,
      profileById,
      versionSnapshotRaw: compareLeftVersion.snapshotRaw,
    });
  }, [compareLeftDraft, compareLeftVersion, profileById]);

  const compareRightSectionLines = useMemo(() => {
    if (!compareRightDraft) {
      return null;
    }

    return buildSectionLineSnapshotFromDraft({
      draft: compareRightDraft,
      profileById,
      versionSnapshotRaw:
        compareRightReference === CV_LAB_VERSION_COMPARE_CURRENT
          ? undefined
          : (compareRightVersion?.snapshotRaw ?? undefined),
    });
  }, [
    compareRightDraft,
    compareRightReference,
    compareRightVersion,
    profileById,
  ]);

  const versionSectionLineDiffs = useMemo(() => {
    if (!compareLeftSectionLines || !compareRightSectionLines) {
      return [] as SectionLineDiff[];
    }

    return buildSectionLineDiffs(
      compareLeftSectionLines,
      compareRightSectionLines,
    );
  }, [compareLeftSectionLines, compareRightSectionLines]);

  const compareLeftLabel = compareLeftVersion
    ? `${compareLeftVersion.label} (${toDate(
        compareLeftVersion.createdAt,
      ).toLocaleString("fr-FR")})`
    : null;

  const compareRightLabel =
    compareRightReference === CV_LAB_VERSION_COMPARE_CURRENT
      ? "Brouillon actuel"
      : compareRightVersion
        ? `${compareRightVersion.label} (${toDate(
            compareRightVersion.createdAt,
          ).toLocaleString("fr-FR")})`
        : null;

  const atsSuggestionDiffItems = useMemo(() => {
    if (!draft || !atsSuggestionPreview) {
      return [] as DraftDiffItem[];
    }

    return buildDraftDiffItems(draft, atsSuggestionPreview.draft);
  }, [atsSuggestionPreview, draft]);

  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges) return;
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", beforeUnload);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
    };
  }, [hasUnsavedChanges]);

  useEffect(() => {
    if (!selectedDocument || !draft) {
      setPreviewHtml(null);
      setPreviewError(null);
      setIsPreviewLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      try {
        setIsPreviewLoading(true);
        const response = await fetch("/api/cv-lab/render", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            documentId: selectedDocument.id,
            mode: "preview",
            snapshot: buildRenderSnapshot(draft),
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          let message = "Impossible de charger la prévisualisation";
          try {
            const errorPayload = (await response.json()) as {
              message?: string;
            };
            if (errorPayload.message) {
              message = errorPayload.message;
            }
          } catch {
            // Keep generic message.
          }

          throw new Error(message);
        }

        const html = await response.text();
        if (!controller.signal.aborted) {
          setPreviewHtml(html);
          setPreviewError(null);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setPreviewError(
            error instanceof Error
              ? error.message
              : "Impossible de charger la prévisualisation",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsPreviewLoading(false);
        }
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [draft, selectedDocument]);

  useEffect(() => {
    if (!selectedDocument || !draft) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      try {
        const payload = {
          version: 1 as const,
          documentId: selectedDocument.id,
          savedAt: new Date().toISOString(),
          draft: normalizeDraft(draft),
        };

        window.localStorage.setItem(
          getLocalDraftStorageKey(selectedDocument.id),
          JSON.stringify(payload),
        );
      } catch {
        // Ignore local storage write failures.
      }
    }, 400);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [draft, selectedDocument]);

  const createMutation = useMutation({
    mutationFn: async () => {
      if (profiles.length === 0) {
        throw new Error("Crée d'abord un profil pour démarrer CV Lab");
      }
      return resolveActionResult(
        createCvLabDocumentAction({
          profileId: profiles[0].id,
          name: `CV ${new Date().toLocaleDateString("fr-FR")}`,
          targetRole: null,
          template: "CLASSIC",
          theme: "MODERN",
          pageSize: "A4",
          accentColor: "#0f172a",
          fontFamily: "Inter",
          headlineOverride: null,
          summaryOverride: null,
          sectionOrder: [...CV_LAB_SECTIONS],
          hiddenSections: [],
        }),
      );
    },
    onSuccess: async (createdDocument) => {
      toast.success("Nouveau CV créé");
      await reloadData(createdDocument.id);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedDocument || !draft) return;
      await resolveActionResult(
        updateCvLabDocumentAction({
          id: selectedDocument.id,
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
        }),
      );
    },
    onSuccess: async () => {
      if (selectedDocumentId) {
        try {
          window.localStorage.removeItem(
            getLocalDraftStorageKey(selectedDocumentId),
          );
        } catch {
          // Ignore local storage failures.
        }
      }
      setRecoverableLocalDraft(null);
      setAtsSuggestionPreview(null);
      toast.success("CV sauvegardé");
      await reloadData(selectedDocumentId);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async () => {
      if (!selectedDocument) return;
      return resolveActionResult(
        duplicateCvLabDocumentAction({
          id: selectedDocument.id,
        }),
      );
    },
    onSuccess: async (copy) => {
      if (!copy) return;
      toast.success("CV dupliqué");
      await reloadData(copy.id);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedDocument) return;
      await resolveActionResult(
        archiveCvLabDocumentAction({ id: selectedDocument.id }),
      );
    },
    onSuccess: async () => {
      toast.success("CV archivé");
      await reloadData(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const restoreDocumentMutation = useMutation({
    mutationFn: async () => {
      if (!selectedDocument) return;
      await resolveActionResult(
        restoreCvLabDocumentAction({ id: selectedDocument.id }),
      );
    },
    onSuccess: async () => {
      toast.success("CV restauré");
      await reloadData(selectedDocumentId);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: async () => {
      if (!selectedDocument) return;
      await resolveActionResult(
        deleteCvLabDocumentAction({ id: selectedDocument.id }),
      );
    },
    onSuccess: async () => {
      if (selectedDocumentId) {
        try {
          window.localStorage.removeItem(
            getLocalDraftStorageKey(selectedDocumentId),
          );
        } catch {
          // Ignore local storage failures.
        }
      }
      setRecoverableLocalDraft(null);
      toast.success("CV supprimé définitivement");
      await reloadData(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleDeleteDocument = () => {
    if (!selectedDocument) return;
    dialogManager.confirm({
      title: "Supprimer le CV",
      description: `Suppression définitive du CV "${selectedDocument.name}". Cette action est irréversible.`,
      confirmText: "SUPPRIMER",
      action: {
        label: "Supprimer",
        variant: "destructive",
        onClick: async () => {
          await deleteDocumentMutation.mutateAsync();
        },
      },
      cancel: { label: "Annuler" },
    });
  };

  const createVersionMutation = useMutation({
    mutationFn: async () => {
      if (!selectedDocument) return;
      await resolveActionResult(
        createCvLabVersionAction({
          documentId: selectedDocument.id,
          label: versionLabel.trim() || undefined,
        }),
      );
    },
    onSuccess: async () => {
      toast.success("Snapshot créé");
      setVersionLabel("");
      if (selectedDocumentId) {
        await refreshVersions(selectedDocumentId);
        await reloadData(selectedDocumentId);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const restoreVersionMutation = useMutation({
    mutationFn: async (versionId: string) => {
      if (!selectedDocument) return;
      await resolveActionResult(
        restoreCvLabVersionAction({
          documentId: selectedDocument.id,
          versionId,
        }),
      );
    },
    onSuccess: async () => {
      toast.success("Version restaurée");
      setAtsSuggestionPreview(null);
      await reloadData(selectedDocumentId);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const atsMutation = useMutation({
    mutationFn: async () => {
      if (!selectedDocument || !draft) return null;
      return resolveActionResult(
        analyzeCvLabAtsAction({
          documentId: selectedDocument.id,
          jobDescription: atsJobDescription.trim() || null,
          snapshot: {
            profileId: draft.profileId,
            targetRole: draft.targetRole || null,
            headlineOverride: draft.headlineOverride || null,
            summaryOverride: draft.summaryOverride || null,
            sectionOrder: draft.sectionOrder,
            hiddenSections: draft.hiddenSections,
          },
        }),
      );
    },
    onSuccess: (analysis) => {
      if (!analysis) return;
      setAtsAnalysis(analysis as AtsAnalysis);
      setAtsSuggestionPreview(null);
      toast.success("Analyse ATS generee");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const exportPdfMutation = useMutation({
    mutationFn: async () => {
      if (!selectedDocument || !draft) {
        throw new Error("Aucun document sélectionné");
      }

      const response = await fetch("/api/cv-lab/render", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documentId: selectedDocument.id,
          mode: "pdf",
          download: true,
          snapshot: buildRenderSnapshot(draft),
        }),
      });

      if (!response.ok) {
        let message = "Impossible de générer le PDF";
        try {
          const errorPayload = (await response.json()) as { message?: string };
          if (errorPayload.message) {
            message = errorPayload.message;
          }
        } catch {
          // Keep generic message.
        }
        throw new Error(message);
      }

      const blob = await response.blob();
      const filename = getFilenameFromDisposition(
        response.headers.get("content-disposition"),
      );

      return {
        blob,
        filename,
      };
    },
    onSuccess: ({ blob, filename }) => {
      const url = window.URL.createObjectURL(blob);
      const anchor = window.document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      window.URL.revokeObjectURL(url);
      toast.success("PDF exporté");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const moveSection = (section: CvLabSection, direction: "up" | "down") => {
    setDraft((prev) => {
      if (!prev) return prev;
      const index = prev.sectionOrder.findIndex((item) => item === section);
      if (index === -1) return prev;
      const nextIndex = direction === "up" ? index - 1 : index + 1;
      if (nextIndex < 0 || nextIndex >= prev.sectionOrder.length) return prev;
      const nextOrder = [...prev.sectionOrder];
      const [removed] = nextOrder.splice(index, 1);
      nextOrder.splice(nextIndex, 0, removed);
      return {
        ...prev,
        sectionOrder: nextOrder,
      };
    });
  };

  const resetDraftFromSavedDocument = () => {
    if (!selectedDocument) return;
    setDraft(normalizeDraft(buildDraft(selectedDocument)));
    setAtsAnalysis(null);
    setAtsSuggestionPreview(null);
    setRecoverableLocalDraft(null);
    try {
      window.localStorage.removeItem(
        getLocalDraftStorageKey(selectedDocument.id),
      );
    } catch {
      // Ignore local storage failures.
    }
    toast.success("Brouillon réinitialisé");
  };

  const restoreRecoverableLocalDraft = () => {
    if (!recoverableLocalDraft) return;
    setDraft(normalizeDraft(recoverableLocalDraft.draft));
    setAtsAnalysis(null);
    setAtsSuggestionPreview(null);
    setRecoverableLocalDraft(null);
    toast.success("Brouillon local restauré");
  };

  const discardRecoverableLocalDraft = () => {
    if (!selectedDocument) return;
    try {
      window.localStorage.removeItem(
        getLocalDraftStorageKey(selectedDocument.id),
      );
    } catch {
      // Ignore local storage failures.
    }
    setRecoverableLocalDraft(null);
    toast.success("Brouillon local ignoré");
  };

  const previewAtsSuggestions = () => {
    if (!draft || !atsAnalysis) {
      return;
    }

    const preview = buildAtsSuggestionPreview({
      draft,
      analysis: atsAnalysis,
      jobDescription: atsJobDescription,
    });

    if (preview.diffItems.length === 0) {
      toast.info("Aucune suggestion ATS actionnable pour le brouillon actuel.");
      setAtsSuggestionPreview(null);
      return;
    }

    setAtsSuggestionPreview(preview);
  };

  const applyAtsSuggestionsToDraft = () => {
    if (!atsSuggestionPreview) {
      return;
    }

    setDraft(atsSuggestionPreview.draft);
    setAtsSuggestionPreview(null);
    toast.success("Suggestions ATS appliquées au brouillon");
  };

  const exportJsonMutation = useMutation({
    mutationFn: async () => {
      if (!selectedDocument || !draft) {
        throw new Error("Aucun document sélectionné");
      }

      const payload = {
        version: 1,
        exportedAt: new Date().toISOString(),
        snapshot: buildRenderSnapshot(draft),
      };

      const filenameBase =
        draft.name
          .trim()
          .replace(/[^a-zA-Z0-9-_]+/g, "-")
          .replace(/^-+|-+$/g, "")
          .toLowerCase() || "cv";

      return {
        json: JSON.stringify(payload, null, 2),
        filename: `${filenameBase}.jobio-cv.json`,
      };
    },
    onSuccess: ({ json, filename }) => {
      const blob = new Blob([json], {
        type: "application/json;charset=utf-8",
      });
      const url = window.URL.createObjectURL(blob);
      const anchor = window.document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      window.URL.revokeObjectURL(url);
      toast.success("Configuration CV exportée");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const importJsonMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!draft || !selectedDocument) {
        throw new Error("Aucun document sélectionné");
      }

      const raw = await file.text();
      let parsedJson: unknown;

      try {
        parsedJson = JSON.parse(raw);
      } catch {
        throw new Error("Le fichier n'est pas un JSON valide");
      }

      const parsed = cvLabImportPayloadSchema.safeParse(parsedJson);
      if (!parsed.success) {
        throw new Error("Format JSON CV Lab invalide");
      }

      const snapshot =
        "snapshot" in parsed.data ? parsed.data.snapshot : parsed.data;

      const normalizedOrder = normalizeSectionOrder(snapshot.sectionOrder);
      const normalizedHidden = normalizeHiddenSections(snapshot.hiddenSections);

      return {
        profileId: snapshot.profileId ?? selectedDocument.profileId,
        name: snapshot.name,
        targetRole: snapshot.targetRole ?? "",
        template: snapshot.template,
        theme: snapshot.theme,
        pageSize: "A4",
        accentColor: snapshot.accentColor,
        fontFamily: snapshot.fontFamily,
        headlineOverride: snapshot.headlineOverride ?? "",
        summaryOverride: snapshot.summaryOverride ?? "",
        sectionOrder: normalizedOrder,
        hiddenSections: normalizedHidden,
      } satisfies Draft;
    },
    onSuccess: (nextDraft) => {
      const hasProfile = profiles.some(
        (profile) => profile.id === nextDraft.profileId,
      );
      const fallbackProfileId = profiles[0]?.id ?? nextDraft.profileId;

      if (!hasProfile) {
        setDraft({
          ...nextDraft,
          profileId: fallbackProfileId,
        });
        toast.warning(
          "Le profil du fichier n'existe pas sur ce compte. Profil courant conservé.",
        );
      } else {
        setDraft(nextDraft);
      }

      setAtsAnalysis(null);
      setAtsSuggestionPreview(null);
      toast.success("Configuration CV importée");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleImportInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    importJsonMutation.mutate(file);
  };

  if (isLoading) {
    return (
      <Layout size="xl">
        <LayoutHeader>
          <LayoutTitle>CV Lab</LayoutTitle>
        </LayoutHeader>
        <LayoutContent>
          <p className="text-muted-foreground text-sm">Chargement...</p>
        </LayoutContent>
      </Layout>
    );
  }

  return (
    <Layout size="xl">
      <LayoutHeader>
        <LayoutTitle>CV Lab</LayoutTitle>
        <LayoutDescription>
          Crée plusieurs CV premium, paramètre les sections, sauvegarde des
          versions et exporte en PDF.
        </LayoutDescription>
      </LayoutHeader>
      <LayoutActions>
        <Button
          onClick={() => createMutation.mutate()}
          disabled={createMutation.isPending}
        >
          <Plus className="mr-2 size-4" />
          Nouveau CV
        </Button>
      </LayoutActions>

      <LayoutContent className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Mes CV</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label>Vue</Label>
              <Select
                value={documentView}
                onValueChange={(value) => {
                  if (hasUnsavedChanges) {
                    dialogManager.confirm({
                      title: "Modifications non sauvegardées",
                      description:
                        "Tu as des modifications non sauvegardées. Changer de vue va les perdre. Continuer ?",
                      action: {
                        label: "Continuer",
                        onClick: async () => {
                          setDocumentView(value as DocumentViewFilter);
                        },
                      },
                      cancel: { label: "Annuler" },
                    });
                    return;
                  }
                  setDocumentView(value as DocumentViewFilter);
                }}
              >
                <SelectTrigger
                  className="w-full"
                  data-testid="cv-lab-view-filter-trigger"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Actifs</SelectItem>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="archived">Archivés</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {documents.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Aucun CV dans cette vue.
              </p>
            ) : (
              documents.map((document) => (
                <button
                  key={document.id}
                  className={cn(
                    "w-full rounded-md border p-3 text-left transition-colors",
                    document.id === selectedDocumentId
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted/40",
                  )}
                  onClick={() => {
                    if (document.id === selectedDocumentId) return;
                    if (hasUnsavedChanges) {
                      dialogManager.confirm({
                        title: "Modifications non sauvegardées",
                        description:
                          "Tu as des modifications non sauvegardées. Changer de CV va les perdre. Continuer ?",
                        action: {
                          label: "Continuer",
                          onClick: async () => {
                            setSelectedDocumentId(document.id);
                          },
                        },
                        cancel: { label: "Annuler" },
                      });
                      return;
                    }
                    setSelectedDocumentId(document.id);
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium">
                      {document.name}
                    </p>
                    <div className="flex items-center gap-2">
                      {document.coachSessionId ? (
                        <Badge
                          variant="outline"
                          className="border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-700 dark:bg-violet-950 dark:text-violet-300"
                        >
                          Coach IA
                        </Badge>
                      ) : null}
                      {document.archivedAt ? (
                        <Badge variant="secondary">Archivé</Badge>
                      ) : null}
                      <span className="text-muted-foreground text-xs">
                        {document._count.versions} v
                      </span>
                    </div>
                  </div>
                  <p className="text-muted-foreground mt-1 truncate text-xs">
                    {document.targetRole ?? "Poste non défini"}
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {toDate(document.updatedAt).toLocaleDateString("fr-FR")}
                  </p>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        {selectedDocument && draft ? (
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] xl:items-start">
            <div className="space-y-4">
              {recoverableLocalDraft ? (
                <Card data-testid="cv-lab-local-recovery-card">
                  <CardHeader>
                    <CardTitle className="text-base">
                      Brouillon local détecté
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-muted-foreground text-sm">
                      Un brouillon non sauvegardé a été retrouvé (
                      {toDate(recoverableLocalDraft.savedAt).toLocaleString(
                        "fr-FR",
                      )}
                      ).
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" onClick={restoreRecoverableLocalDraft}>
                        Restaurer le brouillon local
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={discardRecoverableLocalDraft}
                      >
                        Ignorer le brouillon local
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : null}

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Paramètres</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="cv-name">Nom du CV</Label>
                    <Input
                      id="cv-name"
                      value={draft.name}
                      onChange={(event) =>
                        setDraft((prev) =>
                          prev ? { ...prev, name: event.target.value } : prev,
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cv-target-role">Poste ciblé</Label>
                    <Input
                      id="cv-target-role"
                      value={draft.targetRole}
                      placeholder="Senior Frontend React"
                      onChange={(event) =>
                        setDraft((prev) =>
                          prev
                            ? {
                                ...prev,
                                targetRole: event.target.value,
                              }
                            : prev,
                        )
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Profil source</Label>
                    <Select
                      value={draft.profileId}
                      onValueChange={(value) =>
                        setDraft((prev) =>
                          prev
                            ? {
                                ...prev,
                                profileId: value,
                              }
                            : prev,
                        )
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {profiles.map((profile) => (
                          <SelectItem key={profile.id} value={profile.id}>
                            {profile.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Template</Label>
                    <Select
                      value={draft.template}
                      onValueChange={(value) =>
                        setDraft((prev) =>
                          prev
                            ? {
                                ...prev,
                                template: value as CvLabTemplate,
                              }
                            : prev,
                        )
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CV_LAB_TEMPLATES.map((template) => (
                          <SelectItem key={template} value={template}>
                            {TEMPLATE_LABELS[template]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Thème</Label>
                    <Select
                      value={draft.theme}
                      onValueChange={(value) =>
                        setDraft((prev) =>
                          prev
                            ? {
                                ...prev,
                                theme: value as CvLabTheme,
                              }
                            : prev,
                        )
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CV_LAB_THEMES.map((theme) => (
                          <SelectItem key={theme} value={theme}>
                            {THEME_LABELS[theme]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Taille de page</Label>
                    <div className="bg-muted/40 rounded-md border px-3 py-2 text-sm font-medium">
                      A4 (verrouillé)
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Couleur accent</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        value={draft.accentColor}
                        className="h-10 w-16 p-1"
                        onChange={(event) =>
                          setDraft((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  accentColor: event.target.value,
                                }
                              : prev,
                          )
                        }
                      />
                      <Input
                        value={draft.accentColor}
                        onChange={(event) =>
                          setDraft((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  accentColor: event.target.value,
                                }
                              : prev,
                          )
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Police</Label>
                    <Select
                      value={draft.fontFamily}
                      onValueChange={(value) =>
                        setDraft((prev) =>
                          prev
                            ? {
                                ...prev,
                                fontFamily: value,
                              }
                            : prev,
                        )
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FONT_OPTIONS.map((font) => (
                          <SelectItem key={font} value={font}>
                            {font}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="headline-override">
                      Titre personnalisé
                    </Label>
                    <Input
                      id="headline-override"
                      value={draft.headlineOverride}
                      placeholder="Ex: Lead Product Engineer"
                      onChange={(event) =>
                        setDraft((prev) =>
                          prev
                            ? {
                                ...prev,
                                headlineOverride: event.target.value,
                              }
                            : prev,
                        )
                      }
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="summary-override">
                      Résumé personnalisé
                    </Label>
                    <Textarea
                      id="summary-override"
                      value={draft.summaryOverride}
                      rows={5}
                      placeholder="Pitch adapté à ce poste..."
                      onChange={(event) =>
                        setDraft((prev) =>
                          prev
                            ? {
                                ...prev,
                                summaryOverride: event.target.value,
                              }
                            : prev,
                        )
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Sections</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {draft.sectionOrder.map((section, index) => {
                    const isHidden = draft.hiddenSections.includes(section);
                    return (
                      <div
                        key={section}
                        className="flex items-center justify-between rounded-md border px-3 py-2"
                      >
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={!isHidden}
                            onCheckedChange={(checked) =>
                              setDraft((prev) => {
                                if (!prev) return prev;
                                return {
                                  ...prev,
                                  hiddenSections: checked
                                    ? prev.hiddenSections.filter(
                                        (item) => item !== section,
                                      )
                                    : Array.from(
                                        new Set([
                                          ...prev.hiddenSections,
                                          section,
                                        ]),
                                      ),
                                };
                              })
                            }
                          />
                          <span className="text-sm">
                            {SECTION_LABELS[section]}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            disabled={index === 0}
                            onClick={() => moveSection(section, "up")}
                          >
                            <ArrowUp className="size-4" />
                          </Button>
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            disabled={index === draft.sectionOrder.length - 1}
                            onClick={() => moveSection(section, "down")}
                          >
                            <ArrowDown className="size-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Versions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-col gap-2 md:flex-row">
                    <Input
                      placeholder="Nom du snapshot (optionnel)"
                      value={versionLabel}
                      onChange={(event) => setVersionLabel(event.target.value)}
                    />
                    <Button
                      variant="outline"
                      onClick={() => createVersionMutation.mutate()}
                      disabled={createVersionMutation.isPending}
                    >
                      <History className="mr-2 size-4" />
                      Snapshot
                    </Button>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    {versions.length === 0 ? (
                      <p className="text-muted-foreground text-sm">
                        Aucune version sauvegardée.
                      </p>
                    ) : (
                      versions.map((version) => (
                        <div
                          key={version.id}
                          className="flex items-center justify-between rounded-md border px-3 py-2"
                        >
                          <div>
                            <p className="text-sm font-medium">
                              {version.label}
                            </p>
                            <p className="text-muted-foreground text-xs">
                              {toDate(version.createdAt).toLocaleString(
                                "fr-FR",
                              )}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setCompareLeftVersionId(version.id);
                                setCompareRightReference(
                                  CV_LAB_VERSION_COMPARE_CURRENT,
                                );
                              }}
                            >
                              Comparer
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                restoreVersionMutation.mutate(version.id)
                              }
                              disabled={restoreVersionMutation.isPending}
                            >
                              Restaurer
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <p className="text-sm font-medium">
                      Comparateur de versions
                    </p>
                    {versions.length === 0 ? (
                      <p className="text-muted-foreground text-sm">
                        Crée au moins une version pour comparer.
                      </p>
                    ) : (
                      <>
                        <div className="grid gap-2 md:grid-cols-2">
                          <div className="space-y-1">
                            <Label>Version de référence (avant)</Label>
                            <Select
                              value={compareLeftVersionId}
                              onValueChange={setCompareLeftVersionId}
                            >
                              <SelectTrigger
                                className="w-full"
                                data-testid="cv-lab-version-compare-left"
                              >
                                <SelectValue placeholder="Choisir une version" />
                              </SelectTrigger>
                              <SelectContent>
                                {versions.map((version) => (
                                  <SelectItem
                                    key={version.id}
                                    value={version.id}
                                  >
                                    {version.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-1">
                            <Label>Version cible (après)</Label>
                            <Select
                              value={compareRightReference}
                              onValueChange={setCompareRightReference}
                            >
                              <SelectTrigger
                                className="w-full"
                                data-testid="cv-lab-version-compare-right"
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem
                                  value={CV_LAB_VERSION_COMPARE_CURRENT}
                                >
                                  Brouillon actuel
                                </SelectItem>
                                {versions.map((version) => (
                                  <SelectItem
                                    key={version.id}
                                    value={version.id}
                                  >
                                    {version.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {!compareLeftDraft || !compareRightDraft ? (
                          <p className="text-muted-foreground text-sm">
                            Impossible de comparer ces versions (snapshot
                            incomplet).
                          </p>
                        ) : versionDiffItems.length === 0 &&
                          versionSectionLineDiffs.length === 0 ? (
                          <div className="rounded-md border p-3">
                            <p className="text-sm font-medium">
                              Aucune différence détectée
                            </p>
                            <p className="text-muted-foreground mt-1 text-xs">
                              {compareLeftLabel ?? "Version sélectionnée"} et{" "}
                              {compareRightLabel ?? "cible"} sont identiques.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <p className="text-muted-foreground text-xs">
                              {versionDiffItems.length +
                                versionSectionLineDiffs.length}{" "}
                              changement(s) entre{" "}
                              {compareLeftLabel ?? "version de référence"} et{" "}
                              {compareRightLabel ?? "version cible"}.
                            </p>
                            {versionDiffItems.map((item) => (
                              <div
                                key={item.id}
                                className="rounded-md border p-3"
                                data-testid={`cv-lab-version-diff-${item.id}`}
                              >
                                <p className="text-sm font-medium">
                                  {item.label}
                                </p>
                                <div className="mt-2 grid gap-2 md:grid-cols-2">
                                  <div className="rounded-md border bg-amber-50 p-2">
                                    <p className="text-[11px] font-medium text-amber-800 uppercase">
                                      Avant
                                    </p>
                                    <p className="mt-1 text-xs text-amber-900">
                                      {item.before}
                                    </p>
                                  </div>
                                  <div className="rounded-md border bg-emerald-50 p-2">
                                    <p className="text-[11px] font-medium text-emerald-800 uppercase">
                                      Après
                                    </p>
                                    <p className="mt-1 text-xs text-emerald-900">
                                      {item.after}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}

                            {versionSectionLineDiffs.length > 0 ? (
                              <div className="space-y-2 pt-2">
                                <p className="text-xs font-medium uppercase">
                                  Diff par section (lignes)
                                </p>
                                {versionSectionLineDiffs.map((sectionDiff) => (
                                  <div
                                    key={sectionDiff.sectionId}
                                    className="rounded-md border p-3"
                                    data-testid={`cv-lab-version-section-diff-${sectionDiff.sectionId}`}
                                  >
                                    <p className="text-sm font-medium">
                                      {sectionDiff.sectionLabel}
                                    </p>
                                    <div className="mt-2 grid gap-2 md:grid-cols-2">
                                      <div className="rounded-md border bg-rose-50 p-2">
                                        <p className="text-[11px] font-medium text-rose-800 uppercase">
                                          Lignes supprimées
                                        </p>
                                        {sectionDiff.removedLines.length ===
                                        0 ? (
                                          <p className="mt-1 text-xs text-rose-900">
                                            Aucune
                                          </p>
                                        ) : (
                                          <ul className="mt-1 list-disc space-y-1 pl-4 text-xs text-rose-900">
                                            {sectionDiff.removedLines.map(
                                              (line) => (
                                                <li key={line}>{line}</li>
                                              ),
                                            )}
                                          </ul>
                                        )}
                                      </div>
                                      <div className="rounded-md border bg-emerald-50 p-2">
                                        <p className="text-[11px] font-medium text-emerald-800 uppercase">
                                          Lignes ajoutées
                                        </p>
                                        {sectionDiff.addedLines.length === 0 ? (
                                          <p className="mt-1 text-xs text-emerald-900">
                                            Aucune
                                          </p>
                                        ) : (
                                          <ul className="mt-1 list-disc space-y-1 pl-4 text-xs text-emerald-900">
                                            {sectionDiff.addedLines.map(
                                              (line) => (
                                                <li key={line}>{line}</li>
                                              ),
                                            )}
                                          </ul>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">ATS Check</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="ats-job-description">
                      Fiche de poste (optionnel, recommande)
                    </Label>
                    <Textarea
                      id="ats-job-description"
                      rows={5}
                      placeholder="Colle ici l'offre cible pour evaluer le matching ATS..."
                      value={atsJobDescription}
                      onChange={(event) =>
                        setAtsJobDescription(event.target.value)
                      }
                    />
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => atsMutation.mutate()}
                    disabled={atsMutation.isPending || !draft}
                  >
                    <BarChart3 className="mr-2 size-4" />
                    {atsMutation.isPending
                      ? "Analyse..."
                      : "Lancer l'analyse ATS"}
                  </Button>

                  {atsAnalysis ? (
                    <div className="space-y-4 rounded-md border p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-muted-foreground text-xs uppercase">
                            Score global ATS
                          </p>
                          <p
                            className={cn(
                              "text-2xl font-semibold",
                              getScoreTone(atsAnalysis.overallScore),
                            )}
                          >
                            {atsAnalysis.overallScore}/100
                          </p>
                        </div>
                        <p className="text-muted-foreground text-xs">
                          {toDate(atsAnalysis.generatedAt).toLocaleString(
                            "fr-FR",
                          )}
                        </p>
                      </div>
                      <Progress
                        value={atsAnalysis.overallScore}
                        className="h-2"
                        aria-label="Score ATS"
                      />

                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="rounded-md border p-3">
                          <p className="text-xs font-medium uppercase">
                            Completeness
                          </p>
                          <p className="mt-1 text-sm">
                            {atsAnalysis.scoreBreakdown.completeness}/100
                          </p>
                        </div>
                        <div className="rounded-md border p-3">
                          <p className="text-xs font-medium uppercase">
                            Keyword Match
                          </p>
                          <p className="mt-1 text-sm">
                            {atsAnalysis.scoreBreakdown.keywordMatch}/100
                          </p>
                        </div>
                        <div className="rounded-md border p-3">
                          <p className="text-xs font-medium uppercase">
                            Impact
                          </p>
                          <p className="mt-1 text-sm">
                            {atsAnalysis.scoreBreakdown.impact}/100
                          </p>
                        </div>
                        <div className="rounded-md border p-3">
                          <p className="text-xs font-medium uppercase">
                            Readability
                          </p>
                          <p className="mt-1 text-sm">
                            {atsAnalysis.scoreBreakdown.readability}/100
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-xs font-medium uppercase">
                          Couverture mots-cles
                        </p>
                        <p className="text-muted-foreground text-sm">
                          {atsAnalysis.keywordMetrics.matchedKeywords.length} /{" "}
                          {atsAnalysis.keywordMetrics.targetKeywords.length ||
                            0}{" "}
                          matches ({atsAnalysis.keywordMetrics.coverage}%)
                        </p>
                        {atsAnalysis.keywordMetrics.missingKeywords.length >
                        0 ? (
                          <div className="flex flex-wrap gap-2">
                            {atsAnalysis.keywordMetrics.missingKeywords
                              .slice(0, 12)
                              .map((keyword) => (
                                <Badge key={keyword} variant="outline">
                                  {keyword}
                                </Badge>
                              ))}
                          </div>
                        ) : (
                          <p className="text-sm text-emerald-600">
                            Aucun mot-cle critique manquant.
                          </p>
                        )}
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="space-y-2 rounded-md border p-3">
                          <p className="text-xs font-medium uppercase">
                            Points forts
                          </p>
                          {atsAnalysis.strengths.length > 0 ? (
                            <ul className="list-disc space-y-1 pl-4 text-sm">
                              {atsAnalysis.strengths.map((strength) => (
                                <li key={strength}>{strength}</li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-muted-foreground text-sm">
                              Aucun point fort detecte pour le moment.
                            </p>
                          )}
                        </div>
                        <div className="space-y-2 rounded-md border p-3">
                          <p className="text-xs font-medium uppercase">Gaps</p>
                          {atsAnalysis.gaps.length > 0 ? (
                            <ul className="list-disc space-y-1 pl-4 text-sm">
                              {atsAnalysis.gaps.map((gap) => (
                                <li key={gap}>{gap}</li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-muted-foreground text-sm">
                              Aucun gap critique detecte.
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2 rounded-md border p-3">
                        <p className="text-xs font-medium uppercase">
                          Actions recommandees
                        </p>
                        {atsAnalysis.recommendations.length > 0 ? (
                          <ul className="list-disc space-y-1 pl-4 text-sm">
                            {atsAnalysis.recommendations.map(
                              (recommendation) => (
                                <li key={recommendation}>{recommendation}</li>
                              ),
                            )}
                          </ul>
                        ) : (
                          <p className="text-muted-foreground text-sm">
                            Pas d'action supplementaire immediate.
                          </p>
                        )}
                      </div>

                      <p className="text-muted-foreground text-xs">
                        Elements chiffres detectes:{" "}
                        {atsAnalysis.details.quantifiableStatements}
                      </p>

                      <Separator />

                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={previewAtsSuggestions}
                            data-testid="cv-lab-ats-preview-button"
                          >
                            Prévisualiser suggestions ATS
                          </Button>
                          <p className="text-muted-foreground text-xs">
                            Génère une proposition de modifications avant
                            application.
                          </p>
                        </div>

                        {atsSuggestionPreview ? (
                          <div
                            className="space-y-3 rounded-md border p-3"
                            data-testid="cv-lab-ats-suggestion-preview"
                          >
                            <p className="text-sm font-medium">
                              Aperçu des modifications proposées
                            </p>
                            {atsSuggestionPreview.changeNotes.length > 0 ? (
                              <ul className="list-disc space-y-1 pl-4 text-sm">
                                {atsSuggestionPreview.changeNotes.map(
                                  (note) => (
                                    <li key={note}>{note}</li>
                                  ),
                                )}
                              </ul>
                            ) : null}

                            {atsSuggestionDiffItems.length === 0 ? (
                              <p className="text-muted-foreground text-sm">
                                Aucune différence détectée.
                              </p>
                            ) : (
                              <div className="space-y-2">
                                {atsSuggestionDiffItems.map((item) => (
                                  <div
                                    key={item.id}
                                    className="rounded-md border p-2"
                                    data-testid={`cv-lab-ats-diff-${item.id}`}
                                  >
                                    <p className="text-xs font-medium">
                                      {item.label}
                                    </p>
                                    <div className="mt-1 grid gap-2 md:grid-cols-2">
                                      <div className="rounded-md border bg-amber-50 p-2">
                                        <p className="text-[11px] font-medium text-amber-800 uppercase">
                                          Avant
                                        </p>
                                        <p className="mt-1 text-xs text-amber-900">
                                          {item.before}
                                        </p>
                                      </div>
                                      <div className="rounded-md border bg-emerald-50 p-2">
                                        <p className="text-[11px] font-medium text-emerald-800 uppercase">
                                          Après
                                        </p>
                                        <p className="mt-1 text-xs text-emerald-900">
                                          {item.after}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            <div className="flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                onClick={applyAtsSuggestionsToDraft}
                                data-testid="cv-lab-ats-apply-button"
                              >
                                Appliquer au brouillon
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setAtsSuggestionPreview(null)}
                              >
                                Annuler l'aperçu
                              </Button>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      Lance une analyse pour obtenir un score ATS, les mots-cles
                      manquants et les recommandations de rework.
                    </p>
                  )}
                </CardContent>
              </Card>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  ref={importInputRef}
                  type="file"
                  accept="application/json,.json"
                  className="hidden"
                  onChange={handleImportInputChange}
                />
                <Button
                  onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending || !hasUnsavedChanges}
                >
                  <Save className="mr-2 size-4" />
                  Enregistrer
                </Button>
                <Button
                  variant="ghost"
                  onClick={resetDraftFromSavedDocument}
                  disabled={!hasUnsavedChanges}
                >
                  <RotateCcw className="mr-2 size-4" />
                  Réinitialiser brouillon
                </Button>
                <Button
                  variant="outline"
                  onClick={() => duplicateMutation.mutate()}
                  disabled={duplicateMutation.isPending}
                >
                  <Copy className="mr-2 size-4" />
                  Dupliquer
                </Button>
                <Button
                  variant="outline"
                  onClick={() => exportJsonMutation.mutate()}
                  disabled={exportJsonMutation.isPending}
                >
                  <Download className="mr-2 size-4" />
                  Export JSON
                </Button>
                <Button
                  variant="outline"
                  onClick={() => importInputRef.current?.click()}
                  disabled={importJsonMutation.isPending}
                >
                  <Upload className="mr-2 size-4" />
                  Import JSON
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (!previewHtml) {
                      toast.error("Prévisualisation non disponible");
                      return;
                    }
                    const previewBlob = new Blob([previewHtml], {
                      type: "text/html;charset=utf-8",
                    });
                    const previewBlobUrl =
                      window.URL.createObjectURL(previewBlob);
                    window.open(
                      previewBlobUrl,
                      "_blank",
                      "noopener,noreferrer",
                    );
                    window.setTimeout(() => {
                      window.URL.revokeObjectURL(previewBlobUrl);
                    }, 60_000);
                  }}
                >
                  <Eye className="mr-2 size-4" />
                  Ouvrir preview
                </Button>
                <Button
                  variant="outline"
                  onClick={() => exportPdfMutation.mutate()}
                  disabled={exportPdfMutation.isPending}
                >
                  <FileDown className="mr-2 size-4" />
                  {exportPdfMutation.isPending ? "Export..." : "Export PDF"}
                </Button>
                {selectedDocument.archivedAt ? (
                  <Button
                    variant="outline"
                    onClick={() => restoreDocumentMutation.mutate()}
                    disabled={restoreDocumentMutation.isPending}
                  >
                    <RotateCcw className="mr-2 size-4" />
                    Restaurer
                  </Button>
                ) : (
                  <Button
                    variant="destructive"
                    onClick={() => archiveMutation.mutate()}
                    disabled={archiveMutation.isPending}
                  >
                    <Trash2 className="mr-2 size-4" />
                    Archiver
                  </Button>
                )}
                <Button
                  variant="destructive"
                  onClick={handleDeleteDocument}
                  disabled={deleteDocumentMutation.isPending}
                >
                  <Trash2 className="mr-2 size-4" />
                  Supprimer définitivement
                </Button>
              </div>
            </div>

            <div className="xl:sticky xl:top-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Prévisualisation</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-2 text-xs">
                    Format verrouillé: A4. Les sections sont traitées comme
                    blocs unitaires pour éviter les coupes.
                  </p>
                  {previewError ? (
                    <p className="text-destructive text-sm">{previewError}</p>
                  ) : previewHtml ? (
                    <div className="space-y-2">
                      {isPreviewLoading ? (
                        <p className="text-muted-foreground text-xs">
                          Mise à jour de la prévisualisation...
                        </p>
                      ) : null}
                      <iframe
                        title="cv-preview"
                        srcDoc={previewHtml}
                        className="h-[900px] w-full rounded-md border bg-white"
                      />
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      Génération de la prévisualisation...
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>CV Lab</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Aucun document sélectionné.
              </p>
            </CardContent>
          </Card>
        )}
      </LayoutContent>
    </Layout>
  );
}
