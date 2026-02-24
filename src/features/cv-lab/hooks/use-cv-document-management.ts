"use client";

import { useCallback, useRef, type ChangeEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { dialogManager } from "@/features/dialog-manager/dialog-manager";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import {
  archiveCvLabDocumentAction,
  createCvLabDocumentAction,
  deleteCvLabDocumentAction,
  duplicateCvLabDocumentAction,
  generateCvLabShareTokenAction,
  restoreCvLabDocumentAction,
  revokeCvLabShareTokenAction,
  updateCvLabDocumentAction,
} from "../cv-lab.action";
import {
  CV_LAB_SECTIONS,
  MASTER_CV_SECTIONS,
  type ContentOverrideItem,
  type MasterCvSection,
} from "../cv-lab.schema";
import {
  type CvDocument,
  type CvProfile,
  type Draft,
  buildDraft,
  buildRenderSnapshot,
  cvLabImportPayloadSchema,
  getFilenameFromDisposition,
  getLocalDraftStorageKey,
  normalizeDraft,
  normalizeHiddenSections,
  normalizeSectionOrder,
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

const parseJsonRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
};

const parseContentOverrides = (
  value: unknown,
): Partial<Record<MasterCvSection, ContentOverrideItem[]>> => {
  const record = parseJsonRecord(value);
  if (!record) return {};

  const result: Partial<Record<MasterCvSection, ContentOverrideItem[]>> = {};
  for (const section of MASTER_CV_SECTIONS) {
    const sectionValue = record[section];
    if (!Array.isArray(sectionValue)) continue;
    result[section] = sectionValue.filter(
      (item): item is ContentOverrideItem =>
        item !== null &&
        typeof item === "object" &&
        !Array.isArray(item) &&
        typeof (item as { masterItemId?: unknown }).masterItemId === "string",
    );
  }

  return result;
};

const parseHiddenItems = (
  value: unknown,
): Partial<Record<MasterCvSection, string[]>> => {
  const record = parseJsonRecord(value);
  if (!record) return {};

  const result: Partial<Record<MasterCvSection, string[]>> = {};
  for (const section of MASTER_CV_SECTIONS) {
    const sectionValue = record[section];
    if (!Array.isArray(sectionValue)) continue;
    result[section] = sectionValue.filter(
      (item): item is string => typeof item === "string",
    );
  }

  return result;
};

const parsePersonalInfo = (value: unknown): Record<string, unknown> | null => {
  const record = parseJsonRecord(value);
  if (!record) return null;
  return record;
};

type UseCvDocumentManagementParams = {
  profiles: CvProfile[];
  masterCv: MasterCvData | null;
  setDocuments: React.Dispatch<React.SetStateAction<CvDocument[]>>;
  selectedDocument: CvDocument | null;
  selectedDocumentId: string | null;
  draft: Draft | null;
  setDraft: React.Dispatch<React.SetStateAction<Draft | null>>;
  setAtsAnalysis: (value: null) => void;
  setAtsSuggestionPreview: (value: null) => void;
  setRecoverableLocalDraft: (value: null) => void;
  reloadData: (nextSelectedId?: string | null) => Promise<void>;
  patchSelectedDocument: (patch: Partial<CvDocument>) => void;
};

export function useCvDocumentManagement(params: UseCvDocumentManagementParams) {
  const {
    profiles,
    masterCv,
    setDocuments,
    selectedDocument,
    selectedDocumentId,
    draft,
    setDraft,
    setAtsAnalysis,
    setAtsSuggestionPreview,
    setRecoverableLocalDraft,
    reloadData,
    patchSelectedDocument,
  } = params;

  const importInputRef = useRef<HTMLInputElement | null>(null);

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

  const generateShareLinkMutation = useMutation({
    mutationFn: async () => {
      if (!selectedDocument) {
        throw new Error("Aucun document sélectionné");
      }

      const generatedShare = await resolveActionResult(
        generateCvLabShareTokenAction({ id: selectedDocument.id }),
      );

      return {
        documentId: selectedDocument.id,
        token: generatedShare.token,
      };
    },
    onSuccess: ({ documentId, token }) => {
      setDocuments((previous) =>
        previous.map((document) =>
          document.id === documentId
            ? ({ ...document, shareToken: token } as CvDocument)
            : document,
        ),
      );
      toast.success("Lien public généré");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const revokeShareLinkMutation = useMutation({
    mutationFn: async () => {
      if (!selectedDocument) {
        throw new Error("Aucun document sélectionné");
      }

      await resolveActionResult(
        revokeCvLabShareTokenAction({ id: selectedDocument.id }),
      );

      return {
        documentId: selectedDocument.id,
      };
    },
    onSuccess: ({ documentId }) => {
      setDocuments((previous) =>
        previous.map((document) =>
          document.id === documentId
            ? ({ ...document, shareToken: null } as CvDocument)
            : document,
        ),
      );
      toast.success("Lien public désactivé");
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

      const source = selectedDocument.masterCvId ? "master" : "profile";
      const contentOverrides =
        source === "master"
          ? parseContentOverrides(selectedDocument.contentOverrides)
          : null;
      const hiddenItems =
        source === "master"
          ? parseHiddenItems(selectedDocument.hiddenItems)
          : null;
      const personalInfo =
        source === "master"
          ? parsePersonalInfo(selectedDocument.personalInfo)
          : null;

      const masterCvSnapshot =
        source === "master" && masterCv
          ? {
              id: masterCv.id,
              fullName: masterCv.fullName,
              headline: masterCv.headline,
              summary: masterCv.summary,
              email: masterCv.email,
              phone: masterCv.phone,
              city: masterCv.city,
              photoUrl: masterCv.photoUrl,
              hobbies: masterCv.hobbies,
              driverLicenses: masterCv.driverLicenses,
              experiences: masterCv.experiences,
              skills: masterCv.skills,
              education: masterCv.education,
              projects: masterCv.projects,
              languages: masterCv.languages,
              certifications: masterCv.certifications,
            }
          : null;

      const payload = {
        version: 2,
        exportedAt: new Date().toISOString(),
        snapshot: {
          ...buildRenderSnapshot(draft),
          source,
          masterCvId: source === "master" ? selectedDocument.masterCvId : null,
          contentOverrides,
          hiddenItems,
          personalInfo,
        },
        profileSnapshot: selectedDocument.profile,
        masterCvSnapshot,
        documentMeta: {
          documentId: selectedDocument.id,
          exportedFrom: "cv-lab",
          updatedAt: selectedDocument.updatedAt,
        },
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
      const hasImportedProfile =
        typeof snapshot.profileId === "string" &&
        profiles.some((profile) => profile.id === snapshot.profileId);
      const fallbackProfileId = profiles[0]?.id ?? draft.profileId;

      const source = snapshot.source ?? (snapshot.masterCvId ? "master" : null);
      const hasMasterSnapshotData =
        source === "master" ||
        snapshot.masterCvId !== undefined ||
        snapshot.contentOverrides !== undefined ||
        snapshot.hiddenItems !== undefined ||
        snapshot.personalInfo !== undefined;
      const useMasterSource = source === "master" && Boolean(masterCv?.id);

      const importedDocumentUpdatePatch = hasMasterSnapshotData
        ? useMasterSource
          ? {
              masterCvId: masterCv?.id ?? null,
              contentOverrides: snapshot.contentOverrides ?? null,
              hiddenItems: snapshot.hiddenItems ?? null,
              personalInfo: snapshot.personalInfo ?? null,
            }
          : {
              masterCvId: null,
              contentOverrides: null,
              hiddenItems: null,
              personalInfo: null,
            }
        : null;

      const importedDocumentPatch: Partial<CvDocument> =
        importedDocumentUpdatePatch
          ? {
              masterCvId: importedDocumentUpdatePatch.masterCvId,
              contentOverrides: importedDocumentUpdatePatch.contentOverrides,
              hiddenItems: importedDocumentUpdatePatch.hiddenItems,
              personalInfo: importedDocumentUpdatePatch.personalInfo,
            }
          : {};

      if (importedDocumentUpdatePatch) {
        await resolveActionResult(
          updateCvLabDocumentAction({
            id: selectedDocument.id,
            ...importedDocumentUpdatePatch,
          }),
        );
      }

      const nextDraft = {
        profileId: hasImportedProfile
          ? (snapshot.profileId as string)
          : fallbackProfileId,
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

      return {
        documentId: selectedDocument.id,
        nextDraft,
        importedDocumentPatch,
        profileWasMissing:
          typeof snapshot.profileId === "string" && !hasImportedProfile,
        masterSourceUnavailable:
          hasMasterSnapshotData && source === "master" && !masterCv?.id,
      };
    },
    onSuccess: ({
      documentId,
      nextDraft,
      importedDocumentPatch,
      profileWasMissing,
      masterSourceUnavailable,
    }) => {
      setDraft(nextDraft);
      setDocuments((previous) =>
        previous.map((document) =>
          document.id === documentId
            ? ({ ...document, ...importedDocumentPatch } as CvDocument)
            : document,
        ),
      );

      setAtsAnalysis(null);
      setAtsSuggestionPreview(null);

      if (profileWasMissing) {
        toast.warning(
          "Le profil du fichier n'existe pas sur ce compte. Profil courant conservé.",
        );
      }
      if (masterSourceUnavailable) {
        toast.warning(
          "Le fichier utilisait CV Master, mais aucun CV Master n'est disponible sur ce compte.",
        );
      }
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

  const setDocumentSource = useCallback(
    async (source: "profile" | "master") => {
      if (!selectedDocument) return;

      if (source === "master" && !masterCv?.id) {
        toast.error("Aucun CV Master disponible");
        return;
      }

      try {
        const masterPatch =
          source === "master"
            ? ({
                masterCvId: masterCv?.id ?? null,
              } as Partial<CvDocument>)
            : ({
                masterCvId: null,
                contentOverrides: null,
                hiddenItems: null,
                personalInfo: null,
              } as Partial<CvDocument>);

        await resolveActionResult(
          updateCvLabDocumentAction({
            id: selectedDocument.id,
            ...(draft
              ? {
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
                }
              : {}),
            ...(source === "master"
              ? { masterCvId: masterCv?.id }
              : {
                  masterCvId: null,
                  contentOverrides: null,
                  hiddenItems: null,
                  personalInfo: null,
                }),
          }),
        );
        patchSelectedDocument(masterPatch);
        toast.success(
          source === "master"
            ? "Source basculee sur le CV Master"
            : "Source basculee sur le profil",
        );
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Erreur de mise a jour",
        );
      }
    },
    [draft, masterCv?.id, patchSelectedDocument, selectedDocument],
  );

  const toggleMasterItemVisibility = useCallback(
    async (section: MasterCvSection, itemId: string, visible: boolean) => {
      if (!selectedDocument?.id) return;

      const currentHidden = parseHiddenItems(selectedDocument.hiddenItems);
      const sectionHiddenIds = new Set(currentHidden[section] ?? []);

      if (visible) {
        sectionHiddenIds.delete(itemId);
      } else {
        sectionHiddenIds.add(itemId);
      }

      const nextHidden: Partial<Record<MasterCvSection, string[]>> = {
        ...currentHidden,
        [section]: Array.from(sectionHiddenIds),
      };

      const normalizedHiddenItems: Record<MasterCvSection, string[]> = {
        experiences: nextHidden.experiences ?? [],
        skills: nextHidden.skills ?? [],
        education: nextHidden.education ?? [],
        projects: nextHidden.projects ?? [],
        languages: nextHidden.languages ?? [],
        certifications: nextHidden.certifications ?? [],
      };
      const hasHiddenItems = MASTER_CV_SECTIONS.some(
        (key) => normalizedHiddenItems[key].length > 0,
      );

      try {
        await resolveActionResult(
          updateCvLabDocumentAction({
            id: selectedDocument.id,
            hiddenItems: hasHiddenItems ? normalizedHiddenItems : null,
          }),
        );
        patchSelectedDocument({
          hiddenItems: hasHiddenItems ? normalizedHiddenItems : null,
        });
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Erreur de mise a jour",
        );
      }
    },
    [patchSelectedDocument, selectedDocument],
  );

  const updateMasterItemOverride = useCallback(
    async (
      section: MasterCvSection,
      itemId: string,
      patch: Record<string, unknown>,
    ) => {
      if (!selectedDocument?.id) return;

      const currentOverrides = parseContentOverrides(
        selectedDocument.contentOverrides,
      );
      const sectionOverrides = [...(currentOverrides[section] ?? [])];

      const existingIndex = sectionOverrides.findIndex(
        (item) => item.masterItemId === itemId,
      );

      const existingOverride =
        existingIndex >= 0 ? sectionOverrides[existingIndex] : null;
      const mergedOverride: ContentOverrideItem = {
        ...(existingOverride ?? { masterItemId: itemId }),
        ...patch,
        masterItemId: itemId,
      };

      const hasRealOverrideKeys = Object.keys(mergedOverride).some(
        (key) => key !== "masterItemId",
      );

      if (existingIndex >= 0) {
        if (hasRealOverrideKeys) {
          sectionOverrides[existingIndex] = mergedOverride;
        } else {
          sectionOverrides.splice(existingIndex, 1);
        }
      } else if (hasRealOverrideKeys) {
        sectionOverrides.push(mergedOverride);
      }

      const nextOverrides: Partial<
        Record<MasterCvSection, ContentOverrideItem[]>
      > =
        sectionOverrides.length > 0
          ? {
              ...currentOverrides,
              [section]: sectionOverrides,
            }
          : (Object.fromEntries(
              Object.entries(currentOverrides).filter(
                ([entrySection]) => entrySection !== section,
              ),
            ) as Partial<Record<MasterCvSection, ContentOverrideItem[]>>);

      try {
        await resolveActionResult(
          updateCvLabDocumentAction({
            id: selectedDocument.id,
            contentOverrides:
              Object.keys(nextOverrides).length > 0 ? nextOverrides : null,
          }),
        );
        patchSelectedDocument({
          contentOverrides:
            Object.keys(nextOverrides).length > 0 ? nextOverrides : null,
        });
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Erreur de mise a jour",
        );
      }
    },
    [patchSelectedDocument, selectedDocument],
  );

  const removeMasterItemOverride = useCallback(
    async (section: MasterCvSection, itemId: string) => {
      if (!selectedDocument?.id) return;

      const currentOverrides = parseContentOverrides(
        selectedDocument.contentOverrides,
      );
      const sectionOverrides = (currentOverrides[section] ?? []).filter(
        (item) => item.masterItemId !== itemId,
      );

      const nextOverrides: Partial<
        Record<MasterCvSection, ContentOverrideItem[]>
      > =
        sectionOverrides.length > 0
          ? {
              ...currentOverrides,
              [section]: sectionOverrides,
            }
          : (Object.fromEntries(
              Object.entries(currentOverrides).filter(
                ([entrySection]) => entrySection !== section,
              ),
            ) as Partial<Record<MasterCvSection, ContentOverrideItem[]>>);

      try {
        await resolveActionResult(
          updateCvLabDocumentAction({
            id: selectedDocument.id,
            contentOverrides:
              Object.keys(nextOverrides).length > 0 ? nextOverrides : null,
          }),
        );
        patchSelectedDocument({
          contentOverrides:
            Object.keys(nextOverrides).length > 0 ? nextOverrides : null,
        });
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Erreur de suppression",
        );
      }
    },
    [patchSelectedDocument, selectedDocument],
  );

  return {
    importInputRef,
    createMutation,
    saveMutation,
    duplicateMutation,
    archiveMutation,
    restoreDocumentMutation,
    deleteDocumentMutation,
    generateShareLinkMutation,
    revokeShareLinkMutation,
    exportPdfMutation,
    exportJsonMutation,
    importJsonMutation,
    handleDeleteDocument,
    handleImportInputChange,
    resetDraftFromSavedDocument,
    setDocumentSource,
    toggleMasterItemVisibility,
    updateMasterItemOverride,
    removeMasterItemOverride,
  };
}
