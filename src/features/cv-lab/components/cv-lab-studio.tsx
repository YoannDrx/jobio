"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DocumentStudioLayout } from "@/components/nowts/document-studio-layout";
import { CvLabPreview } from "./cv-lab-preview";
import { CvLabMinimalToolbar } from "./cv-lab-minimal-toolbar";
import { CvLabEditPanel, type CvLabEditTab } from "./cv-lab-edit-panel";
import { CvLabPanelContent } from "./cv-lab-panel-content";
import { getProfilesAction } from "@/features/profiles/profiles.action";
import { resolveActionResult } from "@/lib/actions/actions-utils";
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
import { ArrowLeft, PencilLine, Save } from "lucide-react";
import { CvSectionEditorRouter } from "./section-editors/cv-section-editor-router";

type CvProfile = {
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
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editTab, setEditTab] = useState<CvLabEditTab>("settings");
  const [activeProfileSection, setActiveProfileSection] = useState<
    string | null
  >(null);
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

  const filterDocumentsByView = useCallback((sourceDocuments: CvDocument[]) => {
    return sourceDocuments.filter((document) => !document.archivedAt);
  }, []);

  const reloadData = useCallback(
    async (nextSelectedId?: string | null) => {
      const [profileRows, documentRows] = await Promise.all([
        resolveActionResult(getProfilesAction({})),
        resolveActionResult(
          listCvLabDocumentsAction({
            includeArchived: false,
          }),
        ),
      ]);

      const normalizedProfiles = profileRows.map((profile) => ({
        id: profile.id,
        name: profile.name,
        headline: profile.headline,
        bio: profile.bio,
        experiences: profile.experiences,
        skills: profile.skills,
        education: profile.education,
        projects: profile.projects,
        languages: profile.languages,
        certifications: profile.certifications,
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
    [filterDocumentsByView, refreshVersions, selectedDocumentId],
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

  const handleDraftChange = useCallback((patch: Partial<Draft>) => {
    setDraft((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  const handleSectionClick = useCallback(
    (section: string) => {
      setActiveProfileSection(section);
      if (!isEditOpen) {
        setIsEditOpen(true);
      }
    },
    [isEditOpen],
  );

  const handleProfileSaved = useCallback(async () => {
    await reloadData(selectedDocumentId);
  }, [reloadData, selectedDocumentId]);

  const handleToggleSection = useCallback(
    (section: CvLabSection, visible: boolean) => {
      setDraft((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          hiddenSections: visible
            ? prev.hiddenSections.filter((item) => item !== section)
            : Array.from(new Set([...prev.hiddenSections, section])),
        };
      });
    },
    [],
  );

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
      <div data-full-width className="flex flex-col gap-3">
        <p className="text-muted-foreground text-sm">Chargement...</p>
      </div>
    );
  }

  const editPanelContentNode =
    selectedDocument && draft ? (
      activeProfileSection ? (
        <div className="flex flex-col gap-4">
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm"
            onClick={() => setActiveProfileSection(null)}
          >
            <ArrowLeft className="size-4" />
            Retour aux onglets
          </button>
          <CvSectionEditorRouter
            section={activeProfileSection}
            profile={
              profileById.get(draft.profileId) ?? {
                id: draft.profileId,
                name: "",
                headline: "",
                bio: null,
                experiences: null,
                skills: null,
                education: null,
                projects: null,
                languages: null,
                certifications: null,
              }
            }
            draft={draft}
            onDraftChange={handleDraftChange}
            onProfileSaved={handleProfileSaved}
          />
        </div>
      ) : (
        <CvLabEditPanel
          activeTab={editTab}
          onTabChange={setEditTab}
          draft={draft}
          onDraftChange={handleDraftChange}
          profiles={profiles}
          onToggleSection={handleToggleSection}
          onMoveSection={moveSection}
          versions={versions}
          versionLabel={versionLabel}
          onVersionLabelChange={setVersionLabel}
          onCreateVersion={() => createVersionMutation.mutate()}
          isCreatingVersion={createVersionMutation.isPending}
          onRestoreVersion={(versionId) =>
            restoreVersionMutation.mutate(versionId)
          }
          isRestoringVersion={restoreVersionMutation.isPending}
          compareLeftVersionId={compareLeftVersionId}
          onCompareLeftVersionIdChange={setCompareLeftVersionId}
          compareRightReference={compareRightReference}
          onCompareRightReferenceChange={setCompareRightReference}
          compareLeftDraft={compareLeftDraft}
          compareRightDraft={compareRightDraft}
          versionDiffItems={versionDiffItems}
          versionSectionLineDiffs={versionSectionLineDiffs}
          compareLeftLabel={compareLeftLabel}
          compareRightLabel={compareRightLabel}
          atsJobDescription={atsJobDescription}
          onAtsJobDescriptionChange={setAtsJobDescription}
          onAnalyzeAts={() => atsMutation.mutate()}
          isAnalyzingAts={atsMutation.isPending}
          atsAnalysis={atsAnalysis}
          atsSuggestionPreview={atsSuggestionPreview}
          atsSuggestionDiffItems={atsSuggestionDiffItems}
          onPreviewAtsSuggestions={previewAtsSuggestions}
          onApplyAtsSuggestions={applyAtsSuggestionsToDraft}
          onCancelAtsPreview={() => setAtsSuggestionPreview(null)}
        />
      )
    ) : null;

  return (
    <div data-full-width className="flex flex-col gap-3">
      <DocumentStudioLayout
        toolbar={
          selectedDocument && draft ? (
            <CvLabMinimalToolbar
              documentName={draft.name}
              hasUnsavedChanges={hasUnsavedChanges}
              documents={documents}
              selectedDocumentId={selectedDocumentId}
              onSelectDocument={(id) => {
                setSelectedDocumentId(id);
                setIsEditOpen(true);
                setEditTab("settings");
              }}
              onCreate={() => createMutation.mutate()}
              isCreating={createMutation.isPending}
            />
          ) : null
        }
        preview={
          selectedDocument && draft ? (
            <div className="flex w-full flex-col items-center">
              <div className="mb-2 flex w-full max-w-[794px] justify-end gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending || !hasUnsavedChanges}
                >
                  <Save className="mr-1 size-3.5" />
                  Enregistrer
                </Button>
                <Button
                  size="sm"
                  variant={isEditOpen ? "secondary" : "outline"}
                  onClick={() => setIsEditOpen(!isEditOpen)}
                >
                  <PencilLine className="mr-1 size-3.5" />
                  {isEditOpen ? "Fermer" : "Éditer"}
                </Button>
              </div>
              <CvLabPreview
                previewHtml={previewHtml}
                previewError={previewError}
                isPreviewLoading={isPreviewLoading}
                onSectionClick={handleSectionClick}
              />
            </div>
          ) : null
        }
        editPanelOpen={
          isEditOpen && Boolean(selectedDocument) && Boolean(draft)
        }
        onEditPanelOpenChange={setIsEditOpen}
        editPanelTitle={
          activeProfileSection ? "Éditer la section" : "Éditer le CV"
        }
        editPanelContent={
          selectedDocument && draft ? (
            <CvLabPanelContent
              editPanel={editPanelContentNode}
              recoverableLocalDraft={recoverableLocalDraft}
              onRestoreLocalDraft={restoreRecoverableLocalDraft}
              onDiscardLocalDraft={discardRecoverableLocalDraft}
              onDuplicate={() => duplicateMutation.mutate()}
              isDuplicating={duplicateMutation.isPending}
              onExportJson={() => exportJsonMutation.mutate()}
              isExportingJson={exportJsonMutation.isPending}
              onImportJson={() => importInputRef.current?.click()}
              isImportingJson={importJsonMutation.isPending}
              importInputRef={importInputRef}
              onImportInputChange={handleImportInputChange}
              previewHtml={previewHtml}
              onExportPdf={() => exportPdfMutation.mutate()}
              isExportingPdf={exportPdfMutation.isPending}
              isArchived={Boolean(selectedDocument.archivedAt)}
              onArchive={() => archiveMutation.mutate()}
              isArchiving={archiveMutation.isPending}
              onRestore={() => restoreDocumentMutation.mutate()}
              isRestoring={restoreDocumentMutation.isPending}
              onDelete={handleDeleteDocument}
              isDeleting={deleteDocumentMutation.isPending}
              onReset={resetDraftFromSavedDocument}
              hasUnsavedChanges={hasUnsavedChanges}
            />
          ) : null
        }
        editPanelFooter={
          selectedDocument && draft ? (
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || !hasUnsavedChanges}
              className="w-full"
            >
              Enregistrer
            </Button>
          ) : null
        }
        emptyState={
          !selectedDocument || !draft ? (
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
          ) : undefined
        }
      />
    </div>
  );
}
