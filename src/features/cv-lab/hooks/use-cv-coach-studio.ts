"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { dialogManager } from "@/features/dialog-manager/dialog-manager";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { getProfilesAction } from "@/features/profiles/profiles.action";
import { useFileUpload } from "@/hooks/use-file-upload";
import {
  applyCvCoachToProfileAction,
  archiveCvCoachSessionAction,
  createCvCoachSessionAction,
  getCvCoachSessionAction,
  listCvCoachSessionsAction,
  updateCvCoachSnapshotAction,
  updateCvCoachLockedFieldsAction,
} from "../cv-coach.action";
import { importCvCoachFileAction } from "../cv-coach-file-import.action";
import { createCvCoachVariantAction } from "../cv-coach-variant.action";
import {
  cvCoachSnapshotSchema,
  type CvCoachSnapshot,
} from "../cv-coach.schema";
import type {
  CvCoachMissingItem,
  CvCoachInconsistency,
  CvCoachSourceEvidenceItem,
} from "../cv-coach.schema";

export type ProfileOption = {
  id: string;
  name: string;
  headline: string;
};

export type CoachMessage = {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  createdAt: string | Date;
};

export type CoachSessionListItem = {
  id: string;
  name: string;
  goalRole: string | null;
  status: "ACTIVE" | "COMPLETED" | "ARCHIVED";
  profileId: string | null;
  completenessScore: number;
  archivedAt: string | Date | null;
  updatedAt: string | Date;
  messages: {
    content: string;
  }[];
  _count: {
    messages: number;
    documents: number;
  };
};

export type CoachSessionDetails = {
  id: string;
  name: string;
  goalRole: string | null;
  status: "ACTIVE" | "COMPLETED" | "ARCHIVED";
  profileId: string | null;
  completenessScore: number;
  archivedAt: string | Date | null;
  lastExtractedAt: string | Date | null;
  lockedFields: string[];
  sourceEvidence: CvCoachSourceEvidenceItem[];
  structuredSnapshot: CvCoachSnapshot;
  missingItems: CvCoachMissingItem[];
  inconsistencies: CvCoachInconsistency[];
  nextQuestions: string[];
  messages: CoachMessage[];
};

export async function consumeStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  onChunk: (chunk: Uint8Array) => void,
) {
  const pump = async (): Promise<void> => {
    const { done, value } = await reader.read();
    if (done) return;
    onChunk(value);
    return pump();
  };
  return pump();
}

export const toDateTimeLabel = (value: string | Date) =>
  new Date(value).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export function useCvCoachStudio() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<ProfileOption[]>([]);
  const [sessions, setSessions] = useState<CoachSessionListItem[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null,
  );
  const [activeSession, setActiveSession] =
    useState<CoachSessionDetails | null>(null);
  const [sessionNameInput, setSessionNameInput] = useState("Session CV");
  const [goalRoleInput, setGoalRoleInput] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [applyProfileId, setApplyProfileId] = useState("");
  const [applyMode, setApplyMode] = useState<"MERGE" | "REPLACE">("MERGE");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [isSavingSnapshot, setIsSavingSnapshot] = useState(false);
  const [isApplyingToProfile, setIsApplyingToProfile] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importTab, setImportTab] = useState("text");
  const [fileUploadState, fileUploadActions] = useFileUpload({
    accept: ".pdf,.docx",
    maxSize: 5 * 1024 * 1024,
    maxFiles: 1,
  });
  const [editedSnapshot, setEditedSnapshot] = useState<CvCoachSnapshot | null>(
    null,
  );
  const [lockedFields, setLockedFields] = useState<string[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [dossierPanelOpen, setDossierPanelOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<(HTMLDivElement | null)[]>([]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const scrollToMessage = useCallback((index: number) => {
    const element = messageRefs.current[index];
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      element.classList.add("ring-2", "ring-primary", "ring-offset-2");
      setTimeout(() => {
        element.classList.remove("ring-2", "ring-primary", "ring-offset-2");
      }, 2000);
    }
  }, []);

  const waitForExtraction = useCallback(
    async (sessionId: string, knownExtractedAt: string | Date | null) => {
      const delay = async (ms: number) =>
        new Promise((resolve) => setTimeout(resolve, ms));

      const checkExtraction = async (): Promise<boolean> => {
        const details = await resolveActionResult(
          getCvCoachSessionAction({ sessionId }),
        );
        const session = details as unknown as CoachSessionDetails;

        if (session.lastExtractedAt) {
          const newTime = new Date(session.lastExtractedAt).getTime();
          const oldTime = knownExtractedAt
            ? new Date(knownExtractedAt).getTime()
            : 0;
          if (newTime !== oldTime) {
            setActiveSession(session);
            setEditedSnapshot(session.structuredSnapshot);
            setLockedFields(session.lockedFields);
            return true;
          }
        }
        return false;
      };

      for (let i = 0; i < 10; i++) {
        // eslint-disable-next-line no-await-in-loop
        await delay(1000);
        // eslint-disable-next-line no-await-in-loop
        const found = await checkExtraction();
        if (found) return;
      }

      toast.error("L'extraction des données prend plus de temps que prévu");
    },
    [],
  );

  useEffect(() => {
    scrollToBottom();
  }, [activeSession?.messages.length, streamingText, scrollToBottom]);

  const refreshSessions = useCallback(
    async (nextSelectedId?: string | null) => {
      const rows = await resolveActionResult(
        listCvCoachSessionsAction({ includeArchived: false }),
      );

      const mapped = rows as unknown as CoachSessionListItem[];
      setSessions(mapped);

      const fallback = mapped[0]?.id ?? null;
      const targetId = nextSelectedId ?? selectedSessionId ?? fallback;
      if (!targetId) {
        setSelectedSessionId(null);
        setActiveSession(null);
        return;
      }

      if (!mapped.some((item) => item.id === targetId)) {
        setSelectedSessionId(fallback);
        if (!fallback) {
          setActiveSession(null);
          return;
        }
        const details = await resolveActionResult(
          getCvCoachSessionAction({ sessionId: fallback }),
        );
        setActiveSession(details as unknown as CoachSessionDetails);
        return;
      }

      setSelectedSessionId(targetId);
    },
    [selectedSessionId],
  );

  const loadSessionDetails = useCallback(async (sessionId: string) => {
    const details = await resolveActionResult(
      getCvCoachSessionAction({ sessionId }),
    );
    const session = details as unknown as CoachSessionDetails;
    setActiveSession(session);
    setEditedSnapshot(session.structuredSnapshot);
    setLockedFields(session.lockedFields);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const [profileRows, sessionRows] = await Promise.all([
          resolveActionResult(getProfilesAction({})),
          resolveActionResult(
            listCvCoachSessionsAction({ includeArchived: false }),
          ),
        ]);

        const mappedProfiles = profileRows.map((profile) => ({
          id: profile.id,
          name: profile.name,
          headline: profile.headline,
        }));
        const mappedSessions = sessionRows as unknown as CoachSessionListItem[];

        setProfiles(mappedProfiles);
        setSessions(mappedSessions);

        const firstId = mappedSessions[0]?.id ?? null;
        setSelectedSessionId(firstId);

        if (firstId) {
          const details = await resolveActionResult(
            getCvCoachSessionAction({ sessionId: firstId }),
          );
          const session = details as unknown as CoachSessionDetails;
          setActiveSession(session);
          setEditedSnapshot(session.structuredSnapshot);
        }
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Chargement impossible",
        );
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, []);

  useEffect(() => {
    if (!activeSession) return;
    if (activeSession.profileId) {
      setApplyProfileId(activeSession.profileId);
      return;
    }
    if (profiles.length > 0) {
      setApplyProfileId(profiles[0].id);
    }
  }, [activeSession, profiles]);

  const handleCreateSession = async () => {
    try {
      setIsCreating(true);
      const created = await resolveActionResult(
        createCvCoachSessionAction({
          name: sessionNameInput.trim() || undefined,
          goalRole: goalRoleInput.trim() || undefined,
          profileId: applyProfileId || undefined,
        }),
      );

      const createdSession = created as unknown as CoachSessionDetails;
      await refreshSessions(createdSession.id);
      setSelectedSessionId(createdSession.id);
      setActiveSession(createdSession);
      setEditedSnapshot(createdSession.structuredSnapshot);
      setMessageInput("");
      toast.success("Nouvelle session créée");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Création impossible",
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleSelectSession = async (sessionId: string) => {
    if (sessionId === selectedSessionId) return;
    try {
      setSelectedSessionId(sessionId);
      await loadSessionDetails(sessionId);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Session introuvable",
      );
    }
  };

  const handleSendMessage = async (text?: string) => {
    if (!activeSession) return;
    const trimmed = (text ?? messageInput).trim();
    if (!trimmed) return;

    const previousExtractedAt = activeSession.lastExtractedAt;

    try {
      setIsSending(true);
      setIsStreaming(true);
      setMessageInput("");
      setStreamingText("");

      setActiveSession((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: [
            ...prev.messages,
            {
              id: `temp-${Date.now()}`,
              role: "USER" as const,
              content: trimmed,
              createdAt: new Date(),
            },
          ],
        };
      });

      const response = await fetch("/api/cv-lab/coach/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: activeSession.id,
          message: trimmed,
        }),
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Erreur lors de l'envoi");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("Pas de flux de reponse");

      const decoder = new TextDecoder();
      let accumulated = "";

      await consumeStream(reader, (chunk) => {
        accumulated += decoder.decode(chunk, { stream: true });
        setStreamingText(accumulated);
      });

      setIsStreaming(false);
      setStreamingText("");
      setIsExtracting(true);

      await waitForExtraction(activeSession.id, previousExtractedAt);

      setIsExtracting(false);
      await refreshSessions(activeSession.id);
    } catch (error) {
      setMessageInput(trimmed);
      toast.error(error instanceof Error ? error.message : "Envoi impossible");
      setIsStreaming(false);
      setStreamingText("");
      setIsExtracting(false);
    } finally {
      setIsSending(false);
    }
  };

  const handleSaveSnapshot = async () => {
    if (!activeSession || !editedSnapshot) return;

    const parsed = cvCoachSnapshotSchema.safeParse(editedSnapshot);
    if (!parsed.success) {
      toast.error("Le format du dossier ne respecte pas le schema attendu");
      return;
    }

    try {
      setIsSavingSnapshot(true);
      const updated = await resolveActionResult(
        updateCvCoachSnapshotAction({
          sessionId: activeSession.id,
          snapshot: parsed.data,
          completenessScore: activeSession.completenessScore,
          missingItems: activeSession.missingItems,
          inconsistencies: activeSession.inconsistencies,
          nextQuestions: activeSession.nextQuestions,
        }),
      );

      const session = updated as unknown as CoachSessionDetails;
      setActiveSession(session);
      setEditedSnapshot(session.structuredSnapshot);
      await refreshSessions(activeSession.id);
      toast.success("Dossier sauvegardé");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Sauvegarde impossible",
      );
    } finally {
      setIsSavingSnapshot(false);
    }
  };

  const handleApplyToProfile = async () => {
    if (!activeSession || !applyProfileId) {
      toast.error("Sélectionne un profil cible");
      return;
    }

    try {
      setIsApplyingToProfile(true);
      const result = await resolveActionResult(
        applyCvCoachToProfileAction({
          sessionId: activeSession.id,
          profileId: applyProfileId,
          mode: applyMode,
        }),
      );

      const payload = result as { profile: { name: string } };
      await Promise.all([
        loadSessionDetails(activeSession.id),
        refreshSessions(activeSession.id),
      ]);
      toast.success(`Profil ${payload.profile.name} mis à jour`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Application impossible",
      );
    } finally {
      setIsApplyingToProfile(false);
    }
  };

  const handleArchiveSession = () => {
    if (!activeSession) return;

    dialogManager.confirm({
      title: "Archiver la session",
      description: "Es-tu sûr de vouloir archiver cette session CV Coach ?",
      action: {
        label: "Archiver",
        variant: "destructive",
        onClick: async () => {
          try {
            setIsArchiving(true);
            await resolveActionResult(
              archiveCvCoachSessionAction({ sessionId: activeSession.id }),
            );
            await refreshSessions();
            toast.success("Session archivée");
          } catch (error) {
            toast.error(
              error instanceof Error ? error.message : "Archivage impossible",
            );
          } finally {
            setIsArchiving(false);
          }
        },
      },
      cancel: { label: "Annuler" },
    });
  };

  const handleCreateVariant = () => {
    if (!activeSession || !applyProfileId) return;

    if (activeSession.completenessScore < 50) {
      toast.error(
        "Le dossier doit avoir un score de complétude d'au moins 50%",
      );
      return;
    }

    if (!activeSession.goalRole) {
      toast.error("Un rôle cible doit être défini pour créer un CV");
      return;
    }

    dialogManager.confirm({
      title: "Créer un CV",
      description: `Créer un CV pour le poste "${activeSession.goalRole}" à partir de cette session ?`,
      action: {
        label: "Créer",
        onClick: async () => {
          try {
            const result = await resolveActionResult(
              createCvCoachVariantAction({
                sessionId: activeSession.id,
                profileId: applyProfileId,
              }),
            );
            const payload = result as {
              document: { id: string; name: string };
            };
            toast.success(`CV "${payload.document.name}" créé avec succès`, {
              action: {
                label: "Voir",
                onClick: () => {
                  router.push("/job/cv-studio?tab=editor");
                },
              },
            });
          } catch (error) {
            toast.error(
              error instanceof Error ? error.message : "Création impossible",
            );
          }
        },
      },
      cancel: { label: "Annuler" },
    });
  };

  const handleToggleLock = async (fieldPath: string) => {
    if (!activeSession) return;

    const newLockedFields = lockedFields.includes(fieldPath)
      ? lockedFields.filter((f) => f !== fieldPath)
      : [...lockedFields, fieldPath];

    setLockedFields(newLockedFields);

    try {
      await resolveActionResult(
        updateCvCoachLockedFieldsAction({
          sessionId: activeSession.id,
          lockedFields: newLockedFields,
        }),
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Mise à jour impossible",
      );
      setLockedFields(lockedFields);
    }
  };

  const handleImportText = async () => {
    if (!activeSession || !importText.trim()) return;

    try {
      setIsImporting(true);
      const textToImport = importText.trim();

      setImportDialogOpen(false);
      setImportText("");

      await handleSendMessage(`[CV IMPORTÉ]\n\n${textToImport}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Import impossible");
    } finally {
      setIsImporting(false);
    }
  };

  const handleImportFile = async () => {
    if (!activeSession || fileUploadState.files.length === 0) return;

    const fileWithPreview = fileUploadState.files[0];
    if (!(fileWithPreview.file instanceof File)) return;

    try {
      setIsImporting(true);

      const formData = new FormData();
      formData.append("file", fileWithPreview.file);

      await resolveActionResult(
        importCvCoachFileAction({
          formData,
          sessionId: activeSession.id,
        }),
      );

      setImportDialogOpen(false);
      fileUploadActions.clearFiles();

      await handleSendMessage(
        "[CV IMPORTÉ DEPUIS FICHIER] Analyse le contenu importé.",
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Import impossible");
    } finally {
      setIsImporting(false);
    }
  };

  const handleQuickQuestion = (question: string) => {
    void handleSendMessage(question);
  };

  const handleAskMissingQuestion = (question: string) => {
    void handleSendMessage(question);
  };

  return {
    profiles,
    sessions,
    selectedSessionId,
    activeSession,
    sessionNameInput,
    goalRoleInput,
    messageInput,
    applyProfileId,
    applyMode,
    isLoading,
    isCreating,
    isSending,
    isStreaming,
    streamingText,
    isSavingSnapshot,
    isApplyingToProfile,
    isArchiving,
    importDialogOpen,
    importText,
    isImporting,
    importTab,
    fileUploadState,
    fileUploadActions,
    editedSnapshot,
    lockedFields,
    isExtracting,
    dossierPanelOpen,
    messagesEndRef,
    messageRefs,
    setSessionNameInput,
    setGoalRoleInput,
    setMessageInput,
    setApplyProfileId,
    setApplyMode,
    setImportDialogOpen,
    setImportText,
    setImportTab,
    setEditedSnapshot,
    setDossierPanelOpen,
    handleCreateSession,
    handleSelectSession,
    handleSendMessage,
    handleSaveSnapshot,
    handleApplyToProfile,
    handleArchiveSession,
    handleCreateVariant,
    handleToggleLock,
    handleImportText,
    handleImportFile,
    handleQuickQuestion,
    handleAskMissingQuestion,
    scrollToBottom,
    scrollToMessage,
  };
}
