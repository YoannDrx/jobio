"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Layout,
  LayoutActions,
  LayoutContent,
  LayoutHeader,
  LayoutTitle,
} from "@/features/page/layout";
import { getProfilesAction } from "@/features/profiles/profiles.action";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { cn } from "@/lib/utils";
import { upfetch } from "@/lib/up-fetch";
import {
  Archive,
  BotIcon,
  FileUp,
  Loader2,
  Plus,
  Send,
  UserIcon,
} from "lucide-react";
import { toast } from "sonner";
import { dialogManager } from "@/features/dialog-manager/dialog-manager";
import {
  applyCvCoachToProfileAction,
  archiveCvCoachSessionAction,
  createCvCoachSessionAction,
  getCvCoachSessionAction,
  listCvCoachSessionsAction,
  updateCvCoachSnapshotAction,
} from "../cv-coach.action";
import {
  cvCoachSnapshotSchema,
  type CvCoachSnapshot,
} from "../cv-coach.schema";
import type {
  CvCoachMissingItem,
  CvCoachInconsistency,
  CvCoachSourceEvidenceItem,
} from "../cv-coach.schema";
import { CvCoachSnapshotEditor } from "./cv-coach-snapshot-editor";
import { CvCoachMissingPanel } from "./cv-coach-missing-panel";
import { CvCoachInconsistenciesPanel } from "./cv-coach-inconsistencies-panel";
import { CvCoachQuickQuestions } from "./cv-coach-quick-questions";
import { CvCoachProgressBar } from "./cv-coach-progress-bar";

type ProfileOption = {
  id: string;
  name: string;
  headline: string;
};

type CoachMessage = {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  createdAt: string | Date;
};

type CoachSessionListItem = {
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
  };
};

type CoachSessionDetails = {
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

async function consumeStream(
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

const toDateTimeLabel = (value: string | Date) =>
  new Date(value).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export function CvCoachStudio() {
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
  const [editedSnapshot, setEditedSnapshot] = useState<CvCoachSnapshot | null>(
    null,
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

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

    try {
      setIsSending(true);
      setIsStreaming(true);
      setMessageInput("");
      setStreamingText("");

      // Optimistically add user message
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
        throw new Error("Erreur lors de l'envoi");
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

      // Reload session to get the updated snapshot + structured data
      await Promise.all([
        loadSessionDetails(activeSession.id),
        refreshSessions(activeSession.id),
      ]);
    } catch (error) {
      setMessageInput(trimmed);
      toast.error(error instanceof Error ? error.message : "Envoi impossible");
      setIsStreaming(false);
      setStreamingText("");
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

  const handleImportText = async () => {
    if (!activeSession || !importText.trim()) return;

    try {
      setIsImporting(true);
      await upfetch("/api/cv-lab/coach/import", {
        method: "POST",
        body: {
          sessionId: activeSession.id,
          text: importText.trim(),
        },
      });

      setImportDialogOpen(false);
      setImportText("");

      // Send as a message to trigger AI analysis
      await handleSendMessage(importText.trim());
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

  if (isLoading) {
    return (
      <Layout size="xl">
        <LayoutHeader>
          <LayoutTitle>CV Coach IA</LayoutTitle>
        </LayoutHeader>
        <LayoutContent>
          <div className="flex flex-col gap-3">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-64 w-full" />
          </div>
        </LayoutContent>
      </Layout>
    );
  }

  return (
    <Layout size="xl">
      <LayoutHeader>
        <LayoutTitle>CV Coach IA</LayoutTitle>
      </LayoutHeader>
      <LayoutActions>
        <Button
          variant="outline"
          onClick={() => setImportDialogOpen(true)}
          disabled={!activeSession}
        >
          <FileUp className="size-4" />
          Importer un CV
        </Button>
        <Button onClick={handleCreateSession} disabled={isCreating}>
          <Plus className="size-4" />
          {isCreating ? "Création..." : "Nouvelle session"}
        </Button>
      </LayoutActions>

      <LayoutContent>
        {/* Progress Bar */}
        {activeSession && editedSnapshot ? (
          <div className="mb-4">
            <CvCoachProgressBar
              snapshot={editedSnapshot}
              completenessScore={activeSession.completenessScore}
            />
          </div>
        ) : null}

        {/* Main 3-column layout - Desktop */}
        <div className="hidden gap-4 xl:grid xl:grid-cols-[280px_minmax(0,1fr)_minmax(380px,0.85fr)]">
          {/* Column 1: Sessions */}
          <SessionsSidebar
            sessions={sessions}
            selectedSessionId={selectedSessionId}
            sessionNameInput={sessionNameInput}
            goalRoleInput={goalRoleInput}
            onSessionNameChange={setSessionNameInput}
            onGoalRoleChange={setGoalRoleInput}
            onSelectSession={handleSelectSession}
          />

          {/* Column 2: Chat */}
          {activeSession ? (
            <ChatPanel
              session={activeSession}
              messageInput={messageInput}
              onMessageInputChange={setMessageInput}
              onSend={handleSendMessage}
              isSending={isSending}
              isStreaming={isStreaming}
              streamingText={streamingText}
              messagesEndRef={messagesEndRef}
              onQuickQuestion={handleQuickQuestion}
            />
          ) : (
            <EmptyState />
          )}

          {/* Column 3: Snapshot + Quality */}
          {activeSession && editedSnapshot ? (
            <RightPanel
              session={activeSession}
              snapshot={editedSnapshot}
              onSnapshotChange={setEditedSnapshot}
              onSaveSnapshot={handleSaveSnapshot}
              isSavingSnapshot={isSavingSnapshot}
              profiles={profiles}
              applyProfileId={applyProfileId}
              applyMode={applyMode}
              onApplyProfileIdChange={setApplyProfileId}
              onApplyModeChange={setApplyMode}
              onApplyToProfile={handleApplyToProfile}
              isApplyingToProfile={isApplyingToProfile}
              onArchive={handleArchiveSession}
              isArchiving={isArchiving}
              onAskMissingQuestion={handleAskMissingQuestion}
            />
          ) : null}
        </div>

        {/* Tablet layout (md-lg) */}
        <div className="hidden gap-4 md:grid md:grid-cols-[280px_minmax(0,1fr)] xl:hidden">
          <SessionsSidebar
            sessions={sessions}
            selectedSessionId={selectedSessionId}
            sessionNameInput={sessionNameInput}
            goalRoleInput={goalRoleInput}
            onSessionNameChange={setSessionNameInput}
            onGoalRoleChange={setGoalRoleInput}
            onSelectSession={handleSelectSession}
          />

          {activeSession && editedSnapshot ? (
            <Tabs defaultValue="chat" className="flex-1">
              <TabsList className="w-full">
                <TabsTrigger value="chat" className="flex-1">
                  Chat
                </TabsTrigger>
                <TabsTrigger value="snapshot" className="flex-1">
                  Dossier
                </TabsTrigger>
                <TabsTrigger value="quality" className="flex-1">
                  Qualité
                </TabsTrigger>
              </TabsList>
              <TabsContent value="chat">
                <ChatPanel
                  session={activeSession}
                  messageInput={messageInput}
                  onMessageInputChange={setMessageInput}
                  onSend={handleSendMessage}
                  isSending={isSending}
                  isStreaming={isStreaming}
                  streamingText={streamingText}
                  messagesEndRef={messagesEndRef}
                  onQuickQuestion={handleQuickQuestion}
                />
              </TabsContent>
              <TabsContent value="snapshot">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Dossier structuré
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CvCoachSnapshotEditor
                      snapshot={editedSnapshot}
                      onChange={setEditedSnapshot}
                      onSave={handleSaveSnapshot}
                      isSaving={isSavingSnapshot}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="quality">
                <QualityPanel
                  session={activeSession}
                  profiles={profiles}
                  applyProfileId={applyProfileId}
                  applyMode={applyMode}
                  onApplyProfileIdChange={setApplyProfileId}
                  onApplyModeChange={setApplyMode}
                  onApplyToProfile={handleApplyToProfile}
                  isApplyingToProfile={isApplyingToProfile}
                  onArchive={handleArchiveSession}
                  isArchiving={isArchiving}
                  onAskMissingQuestion={handleAskMissingQuestion}
                />
              </TabsContent>
            </Tabs>
          ) : (
            <EmptyState />
          )}
        </div>

        {/* Mobile layout */}
        <div className="flex flex-col gap-4 md:hidden">
          {activeSession && editedSnapshot ? (
            <Tabs defaultValue="chat">
              <TabsList className="w-full">
                <TabsTrigger value="chat" className="flex-1">
                  Chat
                </TabsTrigger>
                <TabsTrigger value="sessions" className="flex-1">
                  Sessions
                </TabsTrigger>
                <TabsTrigger value="dossier" className="flex-1">
                  Dossier
                </TabsTrigger>
              </TabsList>
              <TabsContent value="chat">
                <ChatPanel
                  session={activeSession}
                  messageInput={messageInput}
                  onMessageInputChange={setMessageInput}
                  onSend={handleSendMessage}
                  isSending={isSending}
                  isStreaming={isStreaming}
                  streamingText={streamingText}
                  messagesEndRef={messagesEndRef}
                  onQuickQuestion={handleQuickQuestion}
                />
              </TabsContent>
              <TabsContent value="sessions">
                <SessionsSidebar
                  sessions={sessions}
                  selectedSessionId={selectedSessionId}
                  sessionNameInput={sessionNameInput}
                  goalRoleInput={goalRoleInput}
                  onSessionNameChange={setSessionNameInput}
                  onGoalRoleChange={setGoalRoleInput}
                  onSelectSession={handleSelectSession}
                />
              </TabsContent>
              <TabsContent value="dossier">
                <RightPanel
                  session={activeSession}
                  snapshot={editedSnapshot}
                  onSnapshotChange={setEditedSnapshot}
                  onSaveSnapshot={handleSaveSnapshot}
                  isSavingSnapshot={isSavingSnapshot}
                  profiles={profiles}
                  applyProfileId={applyProfileId}
                  applyMode={applyMode}
                  onApplyProfileIdChange={setApplyProfileId}
                  onApplyModeChange={setApplyMode}
                  onApplyToProfile={handleApplyToProfile}
                  isApplyingToProfile={isApplyingToProfile}
                  onArchive={handleArchiveSession}
                  isArchiving={isArchiving}
                  onAskMissingQuestion={handleAskMissingQuestion}
                />
              </TabsContent>
            </Tabs>
          ) : (
            <>
              <SessionsSidebar
                sessions={sessions}
                selectedSessionId={selectedSessionId}
                sessionNameInput={sessionNameInput}
                goalRoleInput={goalRoleInput}
                onSessionNameChange={setSessionNameInput}
                onGoalRoleChange={setGoalRoleInput}
                onSelectSession={handleSelectSession}
              />
              <EmptyState />
            </>
          )}
        </div>
      </LayoutContent>

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Importer un CV existant</DialogTitle>
            <DialogDescription>
              Colle le contenu de ton CV (depuis Word, PDF, ou texte brut). Le
              coach l&apos;analysera automatiquement.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder="Colle le contenu de ton CV ici..."
            className="min-h-[200px]"
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setImportDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button
              onClick={handleImportText}
              disabled={isImporting || !importText.trim()}
            >
              {isImporting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Import...
                </>
              ) : (
                <>
                  <FileUp className="size-4" />
                  Importer et analyser
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

// ─── Sub-components ─────────────────────────────────────────────

function EmptyState() {
  return (
    <Card className="flex min-h-[400px] items-center justify-center">
      <CardContent className="text-center">
        <div className="bg-muted mx-auto mb-4 flex size-16 items-center justify-center rounded-full">
          <BotIcon className="text-muted-foreground size-8" />
        </div>
        <p className="text-lg font-semibold">CV Coach IA</p>
        <p className="text-muted-foreground mt-1 text-sm">
          Crée une session pour commencer l&apos;entretien CV guidé.
        </p>
      </CardContent>
    </Card>
  );
}

function SessionsSidebar({
  sessions,
  selectedSessionId,
  sessionNameInput,
  goalRoleInput,
  onSessionNameChange,
  onGoalRoleChange,
  onSelectSession,
}: {
  sessions: CoachSessionListItem[];
  selectedSessionId: string | null;
  sessionNameInput: string;
  goalRoleInput: string;
  onSessionNameChange: (v: string) => void;
  onGoalRoleChange: (v: string) => void;
  onSelectSession: (id: string) => void;
}) {
  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="text-base">Sessions</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="coach-session-name" className="text-xs">
            Nom
          </Label>
          <Input
            id="coach-session-name"
            value={sessionNameInput}
            onChange={(e) => onSessionNameChange(e.target.value)}
            placeholder="CV Frontend - Mars 2026"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="coach-goal-role" className="text-xs">
            Rôle cible
          </Label>
          <Input
            id="coach-goal-role"
            value={goalRoleInput}
            onChange={(e) => onGoalRoleChange(e.target.value)}
            placeholder="Senior React Native"
          />
        </div>

        <Separator />

        {sessions.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Aucune session active.
          </p>
        ) : (
          <div className="flex max-h-[400px] flex-col gap-2 overflow-y-auto">
            {sessions.map((session) => (
              <button
                key={session.id}
                className={cn(
                  "w-full rounded-md border p-3 text-left transition-colors",
                  session.id === selectedSessionId
                    ? "border-primary bg-primary/5"
                    : "hover:bg-muted/40",
                )}
                onClick={() => onSelectSession(session.id)}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium">{session.name}</p>
                  <Badge variant="secondary" className="shrink-0">
                    {session.completenessScore}%
                  </Badge>
                </div>
                <p className="text-muted-foreground mt-1 truncate text-xs">
                  {session.goalRole ?? "Rôle non défini"}
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  {toDateTimeLabel(session.updatedAt)}
                </p>
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ChatPanel({
  session,
  messageInput,
  onMessageInputChange,
  onSend,
  isSending,
  isStreaming,
  streamingText,
  messagesEndRef,
  onQuickQuestion,
}: {
  session: CoachSessionDetails;
  messageInput: string;
  onMessageInputChange: (v: string) => void;
  onSend: (text?: string) => Promise<void>;
  isSending: boolean;
  isStreaming: boolean;
  streamingText: string;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  onQuickQuestion: (q: string) => void;
}) {
  return (
    <Card className="flex min-h-[700px] flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between gap-2 text-base">
          <span className="truncate">{session.name}</span>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{session.status}</Badge>
            <Badge variant="secondary">{session.completenessScore}%</Badge>
          </div>
        </CardTitle>
        {session.goalRole ? (
          <p className="text-muted-foreground text-xs">
            Cible: {session.goalRole}
          </p>
        ) : null}
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">
        {/* Messages */}
        <div className="bg-muted/20 max-h-[500px] flex-1 overflow-y-auto rounded-md border p-3">
          <div className="flex flex-col gap-3">
            {session.messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}

            {/* Streaming message */}
            {isStreaming && streamingText ? (
              <div className="flex items-start gap-2">
                <div className="bg-muted mt-1 flex size-7 shrink-0 items-center justify-center rounded-full">
                  <BotIcon className="size-4" />
                </div>
                <div className="bg-card max-w-[85%] rounded-md border px-3 py-2">
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown>{streamingText}</ReactMarkdown>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Typing indicator */}
            {isStreaming && !streamingText ? (
              <div className="flex items-center gap-2">
                <div className="bg-muted flex size-7 items-center justify-center rounded-full">
                  <BotIcon className="size-4" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-32" />
                  <span className="text-muted-foreground text-xs">
                    Le coach rédige...
                  </span>
                </div>
              </div>
            ) : null}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Quick Questions */}
        <CvCoachQuickQuestions
          questions={session.nextQuestions}
          onSelectQuestion={onQuickQuestion}
          disabled={isSending || isStreaming}
        />

        {/* Input */}
        <div className="flex flex-col gap-2">
          <Textarea
            value={messageInput}
            onChange={(e) => onMessageInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void onSend();
              }
            }}
            placeholder="Raconte ton parcours, le coach structure tout..."
            className="min-h-[80px] resize-none"
            disabled={isSending || isStreaming}
          />
          <div className="flex items-center justify-between gap-2">
            <p className="text-muted-foreground text-xs">
              Entrée pour envoyer, Shift+Entrée pour un saut de ligne
            </p>
            <Button
              onClick={() => void onSend()}
              disabled={isSending || isStreaming || !messageInput.trim()}
              size="sm"
            >
              {isSending || isStreaming ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
              Envoyer
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MessageBubble({ message }: { message: CoachMessage }) {
  const isUser = message.role === "USER";

  return (
    <div
      className={cn(
        "flex items-start gap-2",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      {!isUser ? (
        <div className="bg-muted mt-1 flex size-7 shrink-0 items-center justify-center rounded-full">
          <BotIcon className="size-4" />
        </div>
      ) : null}

      <div
        className={cn(
          "max-w-[85%] rounded-md border px-3 py-2 text-sm",
          isUser ? "bg-primary text-primary-foreground" : "bg-card",
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}
        <p
          className={cn(
            "mt-2 text-[11px]",
            isUser ? "text-primary-foreground/80" : "text-muted-foreground",
          )}
        >
          {toDateTimeLabel(message.createdAt)}
        </p>
      </div>

      {isUser ? (
        <div className="bg-primary/15 mt-1 flex size-7 shrink-0 items-center justify-center rounded-full">
          <UserIcon className="size-4" />
        </div>
      ) : null}
    </div>
  );
}

function RightPanel({
  session,
  snapshot,
  onSnapshotChange,
  onSaveSnapshot,
  isSavingSnapshot,
  profiles,
  applyProfileId,
  applyMode,
  onApplyProfileIdChange,
  onApplyModeChange,
  onApplyToProfile,
  isApplyingToProfile,
  onArchive,
  isArchiving,
  onAskMissingQuestion,
}: {
  session: CoachSessionDetails;
  snapshot: CvCoachSnapshot;
  onSnapshotChange: (s: CvCoachSnapshot) => void;
  onSaveSnapshot: () => void;
  isSavingSnapshot: boolean;
  profiles: ProfileOption[];
  applyProfileId: string;
  applyMode: "MERGE" | "REPLACE";
  onApplyProfileIdChange: (v: string) => void;
  onApplyModeChange: (v: "MERGE" | "REPLACE") => void;
  onApplyToProfile: () => void;
  isApplyingToProfile: boolean;
  onArchive: () => void;
  isArchiving: boolean;
  onAskMissingQuestion: (q: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4 xl:sticky xl:top-4">
      <QualityPanel
        session={session}
        profiles={profiles}
        applyProfileId={applyProfileId}
        applyMode={applyMode}
        onApplyProfileIdChange={onApplyProfileIdChange}
        onApplyModeChange={onApplyModeChange}
        onApplyToProfile={onApplyToProfile}
        isApplyingToProfile={isApplyingToProfile}
        onArchive={onArchive}
        isArchiving={isArchiving}
        onAskMissingQuestion={onAskMissingQuestion}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dossier structuré</CardTitle>
        </CardHeader>
        <CardContent>
          <CvCoachSnapshotEditor
            snapshot={snapshot}
            onChange={onSnapshotChange}
            onSave={onSaveSnapshot}
            isSaving={isSavingSnapshot}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function QualityPanel({
  session,
  profiles,
  applyProfileId,
  applyMode,
  onApplyProfileIdChange,
  onApplyModeChange,
  onApplyToProfile,
  isApplyingToProfile,
  onArchive,
  isArchiving,
  onAskMissingQuestion,
}: {
  session: CoachSessionDetails;
  profiles: ProfileOption[];
  applyProfileId: string;
  applyMode: "MERGE" | "REPLACE";
  onApplyProfileIdChange: (v: string) => void;
  onApplyModeChange: (v: "MERGE" | "REPLACE") => void;
  onApplyToProfile: () => void;
  isApplyingToProfile: boolean;
  onArchive: () => void;
  isArchiving: boolean;
  onAskMissingQuestion: (q: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      {/* Completeness */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">État du dossier</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-sm">
              <span>Complétude</span>
              <span
                className={cn(
                  "font-semibold",
                  session.completenessScore >= 80
                    ? "text-emerald-600"
                    : session.completenessScore >= 55
                      ? "text-amber-600"
                      : "text-rose-600",
                )}
              >
                {session.completenessScore}%
              </span>
            </div>
            <Progress value={session.completenessScore} />
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-md border p-2">
              <p className="text-muted-foreground text-xs">Manques</p>
              <p className="font-semibold">{session.missingItems.length}</p>
            </div>
            <div className="rounded-md border p-2">
              <p className="text-muted-foreground text-xs">Incohérences</p>
              <p className="font-semibold">{session.inconsistencies.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Missing Items */}
      {session.missingItems.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Points manquants</CardTitle>
          </CardHeader>
          <CardContent>
            <CvCoachMissingPanel
              missingItems={session.missingItems}
              onAskQuestion={onAskMissingQuestion}
            />
          </CardContent>
        </Card>
      ) : null}

      {/* Inconsistencies */}
      {session.inconsistencies.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Incohérences</CardTitle>
          </CardHeader>
          <CardContent>
            <CvCoachInconsistenciesPanel
              inconsistencies={session.inconsistencies}
            />
          </CardContent>
        </Card>
      ) : null}

      {/* Apply to Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Appliquer au profil</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <Label className="text-xs">Profil cible</Label>
            <Select
              value={applyProfileId}
              onValueChange={onApplyProfileIdChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sélectionne un profil" />
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

          <div className="flex flex-col gap-2">
            <Label className="text-xs">Mode</Label>
            <Select
              value={applyMode}
              onValueChange={(v) => onApplyModeChange(v as "MERGE" | "REPLACE")}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MERGE">Fusionner</SelectItem>
                <SelectItem value="REPLACE">Remplacer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={onApplyToProfile}
            disabled={isApplyingToProfile || profiles.length === 0}
            className="w-full"
          >
            {isApplyingToProfile ? "Application..." : "Appliquer au profil"}
          </Button>

          <Separator />

          <Button
            variant="outline"
            className="w-full"
            onClick={onArchive}
            disabled={isArchiving}
          >
            <Archive className="size-4" />
            {isArchiving ? "Archivage..." : "Archiver"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
