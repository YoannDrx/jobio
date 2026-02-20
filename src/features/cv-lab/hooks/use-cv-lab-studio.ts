"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { dialogManager } from "@/features/dialog-manager/dialog-manager";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { getProfilesAction } from "@/features/profiles/profiles.action";
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
import { CV_LAB_SECTIONS, type CvLabSection } from "../cv-lab.schema";
import type { CvLabEditTab } from "../components/cv-lab-edit-panel";
import {
  type AtsAnalysis,
  type AtsSuggestionPreview,
  type CvDocument,
  type CvProfile,
  type CvVersion,
  type Draft,
  type DraftDiffItem,
  type SectionLineDiff,
  CV_LAB_VERSION_COMPARE_CURRENT,
  areDraftsEqual,
  buildAtsSuggestionPreview,
  buildDraft,
  buildDraftDiffItems,
  buildRenderSnapshot,
  buildSectionLineDiffs,
  buildSectionLineSnapshotFromDraft,
  cvLabImportPayloadSchema,
  cvLabLocalDraftPayloadSchema,
  getFilenameFromDisposition,
  getLocalDraftStorageKey,
  normalizeDraft,
  normalizeHiddenSections,
  normalizeSectionOrder,
  parseDraftFromVersionSnapshot,
  toDate,
} from "../cv-lab-utils";

export function useCvLabStudio() {
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

  // Preview HTML rendering
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

  // --- Mutations ---

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

  // --- Handlers ---

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

  const cancelAtsPreview = () => {
    setAtsSuggestionPreview(null);
  };

  const handleImportInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    importJsonMutation.mutate(file);
  };

  const handleSelectDocument = (id: string) => {
    setSelectedDocumentId(id);
    setIsEditOpen(true);
    setEditTab("settings");
  };

  return {
    // State
    profiles,
    documents,
    selectedDocumentId,
    selectedDocument,
    draft,
    versions,
    versionLabel,
    setVersionLabel,
    atsJobDescription,
    setAtsJobDescription,
    atsAnalysis,
    atsSuggestionPreview,
    atsSuggestionDiffItems,
    previewHtml,
    previewError,
    isPreviewLoading,
    compareLeftVersionId,
    setCompareLeftVersionId,
    compareRightReference,
    setCompareRightReference,
    compareLeftDraft,
    compareRightDraft,
    versionDiffItems,
    versionSectionLineDiffs,
    compareLeftLabel,
    compareRightLabel,
    recoverableLocalDraft,
    isLoading,
    isEditOpen,
    setIsEditOpen,
    editTab,
    setEditTab,
    activeProfileSection,
    setActiveProfileSection,
    importInputRef,
    hasUnsavedChanges,
    profileById,

    // Mutations
    createMutation,
    saveMutation,
    duplicateMutation,
    archiveMutation,
    restoreDocumentMutation,
    deleteDocumentMutation,
    createVersionMutation,
    restoreVersionMutation,
    atsMutation,
    exportPdfMutation,
    exportJsonMutation,
    importJsonMutation,

    // Handlers
    handleDraftChange,
    handleSectionClick,
    handleProfileSaved,
    handleToggleSection,
    moveSection,
    resetDraftFromSavedDocument,
    restoreRecoverableLocalDraft,
    discardRecoverableLocalDraft,
    previewAtsSuggestions,
    applyAtsSuggestionsToDraft,
    cancelAtsPreview,
    handleImportInputChange,
    handleDeleteDocument,
    handleSelectDocument,
  };
}
