"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { getProfilesAction } from "@/features/profiles/profiles.action";
import { getCurrentPlanAction } from "@/features/plans/check-limits.action";
import { getMasterCvAction } from "@/features/cv-lab/master-cv.action";
import { useUndoRedo } from "./use-undo-redo";
import { useCvDocumentManagement } from "./use-cv-document-management";
import { useCvPreview } from "./use-cv-preview";
import { useCvAts } from "./use-cv-ats";
import { useCvVersions } from "./use-cv-versions";
import {
  listCvLabDocumentsAction,
  updateCvLabDocumentAction,
} from "../cv-lab.action";
import { type CvLabSection } from "../cv-lab.schema";
import type { CvLabEditTab } from "../components/cv-lab-edit-panel";
import {
  type CvDocument,
  type CvProfile,
  type Draft,
  areDraftsEqual,
  buildDraft,
  cvLabLocalDraftPayloadSchema,
  getLocalDraftStorageKey,
  normalizeDraft,
} from "../cv-lab-utils";

type MasterCvData = {
  id: string;
  fullName: string;
  headline: string | null;
  summary: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  photoUrl: string | null;
  hobbies: unknown;
  driverLicenses: unknown;
  socialLinks: unknown;
  experiences: unknown;
  skills: unknown;
  education: unknown;
  projects: unknown;
  languages: unknown;
  certifications: unknown;
};

type AutoSaveStatus = "idle" | "saving" | "saved" | "error";

export function useCvLabStudio() {
  const [profiles, setProfiles] = useState<CvProfile[]>([]);
  const [masterCv, setMasterCv] = useState<MasterCvData | null>(null);
  const [documents, setDocuments] = useState<CvDocument[]>([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(
    null,
  );
  const [draft, setDraft] = useState<Draft | null>(null);
  const [recoverableLocalDraft, setRecoverableLocalDraft] = useState<{
    draft: Draft;
    savedAt: string;
  } | null>(null);
  const [canUseAllCvTemplates, setCanUseAllCvTemplates] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editTab, setEditTab] = useState<CvLabEditTab>("settings");
  const [activeProfileSection, setActiveProfileSection] = useState<
    string | null
  >(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>("idle");
  const undoRedo = useUndoRedo<Draft>();
  const lastSavedDraftJsonRef = useRef<string | null>(null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedDocument = useMemo(
    () =>
      documents.find((document) => document.id === selectedDocumentId) ?? null,
    [documents, selectedDocumentId],
  );

  const profileById = useMemo(
    () => new Map(profiles.map((profile) => [profile.id, profile] as const)),
    [profiles],
  );

  // --- Sub-hooks ---

  const ats = useCvAts({
    selectedDocument,
    draft,
    setDraft,
  });

  const versionHook = useCvVersions({
    selectedDocument,
    selectedDocumentId,
    draft,
    profileById,
    setAtsSuggestionPreview: (v: null) => ats.setAtsSuggestionPreview(v),
    reloadData: async () => Promise.resolve(), // placeholder — reloadData calls refreshVersions directly
  });

  const { refreshVersions, setVersions: setVersionsList } = versionHook;
  const { resetAtsState } = ats;

  const filterDocumentsByView = useCallback((sourceDocuments: CvDocument[]) => {
    return sourceDocuments.filter((document) => !document.archivedAt);
  }, []);

  const reloadData = useCallback(
    async (nextSelectedId?: string | null) => {
      const [profileRows, documentRows, planInfo, masterCvRow] =
        await Promise.all([
          resolveActionResult(getProfilesAction({})),
          resolveActionResult(
            listCvLabDocumentsAction({
              includeArchived: false,
            }),
          ),
          resolveActionResult(getCurrentPlanAction()),
          resolveActionResult(getMasterCvAction()),
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
      setCanUseAllCvTemplates(planInfo.plan !== "free");
      const visibleDocuments = filterDocumentsByView(normalizedDocuments);
      setMasterCv((masterCvRow as MasterCvData | null) ?? null);

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
        setVersionsList([]);
      }
    },
    [
      filterDocumentsByView,
      refreshVersions,
      setVersionsList,
      selectedDocumentId,
    ],
  );

  const patchSelectedDocument = useCallback(
    (patch: Partial<CvDocument>) => {
      if (!selectedDocument?.id) return;
      setDocuments((previous) =>
        previous.map((document) =>
          document.id === selectedDocument.id
            ? ({ ...document, ...patch } as CvDocument)
            : document,
        ),
      );
    },
    [selectedDocument?.id],
  );

  const documentManagement = useCvDocumentManagement({
    profiles,
    masterCv,
    setDocuments,
    selectedDocument,
    selectedDocumentId,
    draft,
    setDraft,
    setAtsAnalysis: () => ats.setAtsAnalysis(null),
    setAtsSuggestionPreview: () => ats.setAtsSuggestionPreview(null),
    setRecoverableLocalDraft: () => setRecoverableLocalDraft(null),
    reloadData,
    patchSelectedDocument,
  });

  const preview = useCvPreview({
    selectedDocument,
    draft,
    masterCv,
    profileById,
  });

  // Initial load
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

  // Sync draft + local draft recovery on document change
  useEffect(() => {
    if (!selectedDocument) {
      setDraft(null);
      setVersionsList([]);
      resetAtsState();
      setRecoverableLocalDraft(null);
      setAutoSaveStatus("idle");
      lastSavedDraftJsonRef.current = null;
      return;
    }
    const savedDraft = normalizeDraft(buildDraft(selectedDocument));
    setDraft(savedDraft);
    lastSavedDraftJsonRef.current = JSON.stringify(savedDraft);
    resetAtsState();
    setRecoverableLocalDraft(null);
    setAutoSaveStatus("idle");

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
  }, [refreshVersions, setVersionsList, resetAtsState, selectedDocument]);

  const hasUnsavedChanges = useMemo(() => {
    if (!selectedDocument || !draft) return false;
    const normalizedSelected = buildDraft(selectedDocument);
    return JSON.stringify(normalizedSelected) !== JSON.stringify(draft);
  }, [selectedDocument, draft]);

  // Warn on unsaved changes before unload
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

  // Auto-save draft to local storage
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

  // Auto-save to server with debounce
  useEffect(() => {
    if (!selectedDocument || !draft) {
      return;
    }

    const currentDraftJson = JSON.stringify(draft);

    // Skip if draft hasn't changed since last save
    if (currentDraftJson === lastSavedDraftJsonRef.current) {
      return;
    }

    // Skip if no unsaved changes vs server
    if (!hasUnsavedChanges) {
      lastSavedDraftJsonRef.current = currentDraftJson;
      return;
    }

    // Don't auto-save while a manual save is in progress
    if (documentManagement.saveMutation.isPending) {
      return;
    }

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(async () => {
      setAutoSaveStatus("saving");
      try {
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

        lastSavedDraftJsonRef.current = currentDraftJson;

        try {
          window.localStorage.removeItem(
            getLocalDraftStorageKey(selectedDocument.id),
          );
        } catch {
          // Ignore
        }

        setRecoverableLocalDraft(null);
        setAutoSaveStatus("saved");

        // Refresh documents list to sync
        await reloadData(selectedDocument.id);

        setTimeout(() => {
          setAutoSaveStatus((prev) => (prev === "saved" ? "idle" : prev));
        }, 2000);
      } catch {
        setAutoSaveStatus("error");
      }
    }, 2000);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [
    draft,
    hasUnsavedChanges,
    documentManagement.saveMutation.isPending,
    selectedDocument,
    reloadData,
  ]);

  // --- Handlers ---

  const handleDraftChange = useCallback(
    (patch: Partial<Draft>) => {
      setDraft((prev) => {
        if (!prev) return prev;
        const next = { ...prev, ...patch };
        undoRedo.push(next);
        return next;
      });
    },
    [undoRedo],
  );

  const handleUndo = useCallback(() => {
    const state = undoRedo.undo();
    if (state) setDraft(state);
  }, [undoRedo]);

  const handleRedo = useCallback(() => {
    const state = undoRedo.redo();
    if (state) setDraft(state);
  }, [undoRedo]);

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

  const restoreRecoverableLocalDraft = () => {
    if (!recoverableLocalDraft) return;
    setDraft(normalizeDraft(recoverableLocalDraft.draft));
    ats.setAtsAnalysis(null);
    ats.setAtsSuggestionPreview(null);
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

  const handleSelectDocument = (id: string) => {
    setSelectedDocumentId(id);
    setIsEditOpen(true);
    setEditTab("settings");
  };

  return {
    // State
    profiles,
    masterCv,
    documents,
    selectedDocumentId,
    selectedDocument,
    draft,
    versions: versionHook.versions,
    versionLabel: versionHook.versionLabel,
    setVersionLabel: versionHook.setVersionLabel,
    atsJobDescription: ats.atsJobDescription,
    setAtsJobDescription: ats.setAtsJobDescription,
    atsAnalysis: ats.atsAnalysis,
    atsSuggestionPreview: ats.atsSuggestionPreview,
    atsSuggestionDiffItems: ats.atsSuggestionDiffItems,
    previewHtml: preview.previewHtml,
    previewError: preview.previewError,
    isPreviewLoading: preview.isPreviewLoading,
    canUseAllCvTemplates,
    compareLeftVersionId: versionHook.compareLeftVersionId,
    setCompareLeftVersionId: versionHook.setCompareLeftVersionId,
    compareRightReference: versionHook.compareRightReference,
    setCompareRightReference: versionHook.setCompareRightReference,
    compareLeftDraft: versionHook.compareLeftDraft,
    compareRightDraft: versionHook.compareRightDraft,
    versionDiffItems: versionHook.versionDiffItems,
    versionSectionLineDiffs: versionHook.versionSectionLineDiffs,
    compareLeftLabel: versionHook.compareLeftLabel,
    compareRightLabel: versionHook.compareRightLabel,
    recoverableLocalDraft,
    isLoading,
    isEditOpen,
    setIsEditOpen,
    editTab,
    setEditTab,
    activeProfileSection,
    setActiveProfileSection,
    importInputRef: documentManagement.importInputRef,
    hasUnsavedChanges,
    autoSaveStatus,
    profileById,

    // Mutations
    createMutation: documentManagement.createMutation,
    saveMutation: documentManagement.saveMutation,
    duplicateMutation: documentManagement.duplicateMutation,
    archiveMutation: documentManagement.archiveMutation,
    restoreDocumentMutation: documentManagement.restoreDocumentMutation,
    deleteDocumentMutation: documentManagement.deleteDocumentMutation,
    createVersionMutation: versionHook.createVersionMutation,
    restoreVersionMutation: versionHook.restoreVersionMutation,
    atsMutation: ats.atsMutation,
    generateShareLinkMutation: documentManagement.generateShareLinkMutation,
    revokeShareLinkMutation: documentManagement.revokeShareLinkMutation,
    exportPdfMutation: documentManagement.exportPdfMutation,
    exportJsonMutation: documentManagement.exportJsonMutation,
    importJsonMutation: documentManagement.importJsonMutation,

    // Handlers
    handleDraftChange,
    handleSectionClick,
    handleProfileSaved,
    handleToggleSection,
    moveSection,
    resetDraftFromSavedDocument: documentManagement.resetDraftFromSavedDocument,
    restoreRecoverableLocalDraft,
    discardRecoverableLocalDraft,
    previewAtsSuggestions: ats.previewAtsSuggestions,
    applyAtsSuggestionsToDraft: ats.applyAtsSuggestionsToDraft,
    cancelAtsPreview: ats.cancelAtsPreview,
    handleImportInputChange: documentManagement.handleImportInputChange,
    handleDeleteDocument: documentManagement.handleDeleteDocument,
    handleSelectDocument,
    setDocumentSource: documentManagement.setDocumentSource,
    toggleMasterItemVisibility: documentManagement.toggleMasterItemVisibility,
    updateMasterItemOverride: documentManagement.updateMasterItemOverride,
    removeMasterItemOverride: documentManagement.removeMasterItemOverride,
    handleUndo,
    handleRedo,
    canUndo: undoRedo.canUndo,
    canRedo: undoRedo.canRedo,
  };
}
