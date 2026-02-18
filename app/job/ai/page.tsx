"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  MessageSquareIcon,
  PlusIcon,
  SendIcon,
  TrashIcon,
  MenuIcon,
  BotIcon,
  UserIcon,
  Loader2Icon,
  PenToolIcon,
  TrendingUpIcon,
  BriefcaseIcon,
  CalendarIcon,
  ReceiptIcon,
} from "lucide-react";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import {
  getChatThreadsAction,
  getChatThreadAction,
  createChatThreadAction,
  deleteChatThreadAction,
} from "@/features/ai/chat/chat.action";
import ReactMarkdown from "react-markdown";

type SuggestedPrompt = {
  label: string;
  prompt: string;
  icon: React.ReactNode;
};

const SUGGESTED_PROMPTS: SuggestedPrompt[] = [
  {
    label: "Analyse mon pipeline",
    prompt:
      "Analyse mon pipeline de missions actuel et donne-moi des recommandations pour améliorer mon taux de conversion.",
    icon: <TrendingUpIcon className="size-4" />,
  },
  {
    label: "Rédige un message",
    prompt:
      "Aide-moi à rédiger un message de candidature percutant pour une mission.",
    icon: <PenToolIcon className="size-4" />,
  },
  {
    label: "Évalue mon TJM",
    prompt:
      "Aide-moi à évaluer si mon TJM est bien positionné sur le marché et comment négocier une augmentation.",
    icon: <TrendingUpIcon className="size-4" />,
  },
  {
    label: "Prépare-moi entretien",
    prompt:
      "Aide-moi à préparer mon prochain entretien client : les questions à anticiper, les points à valoriser.",
    icon: <BriefcaseIcon className="size-4" />,
  },
  {
    label: "Plan d'action du jour",
    prompt:
      "Qu'est-ce que je devrais prioriser aujourd'hui dans ma prospection ?",
    icon: <CalendarIcon className="size-4" />,
  },
  {
    label: "Message de relance",
    prompt:
      "Aide-moi à rédiger un message de relance professionnel et non-intrusif.",
    icon: <MessageSquareIcon className="size-4" />,
  },
  {
    label: "Mes factures",
    prompt: "Résume mes factures en attente et mon CA ce mois-ci.",
    icon: <ReceiptIcon className="size-4" />,
  },
  {
    label: "Mon agenda",
    prompt: "Quelles relances dois-je faire cette semaine ?",
    icon: <CalendarIcon className="size-4" />,
  },
];

type ChatThread = {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
};

export default function AIChatPage() {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [isLoadingThreads, setIsLoadingThreads] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/ai/chat",
      body: { threadId: activeThreadId },
    }),
  });

  const isStreaming = status === "streaming";

  const loadThreads = useCallback(async () => {
    try {
      const result = await resolveActionResult(getChatThreadsAction());
      setThreads(result);
    } finally {
      setIsLoadingThreads(false);
    }
  }, []);

  useEffect(() => {
    void loadThreads();
  }, [loadThreads]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleCreateThread = async () => {
    const thread = await resolveActionResult(
      createChatThreadAction({ title: undefined }),
    );
    setThreads((prev) => [thread, ...prev]);
    setActiveThreadId(thread.id);
    setMessages([]);
    setIsSidebarOpen(false);
  };

  const handleDeleteThread = async (threadId: string) => {
    await resolveActionResult(deleteChatThreadAction({ threadId }));
    setThreads((prev) => prev.filter((t) => t.id !== threadId));
    if (activeThreadId === threadId) {
      setActiveThreadId(null);
      setMessages([]);
    }
  };

  const handleSelectThread = async (threadId: string) => {
    setActiveThreadId(threadId);
    setMessages([]);
    setIsSidebarOpen(false);
    try {
      const thread = await resolveActionResult(
        getChatThreadAction({ threadId }),
      );
      const restored: UIMessage[] = thread.messages.map((msg) => ({
        id: msg.id,
        role: msg.role === "USER" ? "user" : "assistant",
        parts: [{ type: "text" as const, text: msg.content }],
        createdAt: new Date(msg.createdAt),
      }));
      setMessages(restored);
    } catch {
      // Thread might have no messages yet
    }
  };

  const threadList = (
    <div className="flex h-full flex-col">
      <div className="p-4">
        <Button onClick={handleCreateThread} className="w-full" size="sm">
          <PlusIcon />
          Nouvelle conversation
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {isLoadingThreads ? (
          <div className="flex flex-col gap-2 p-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : threads.length === 0 ? (
          <p className="text-muted-foreground p-4 text-center text-sm">
            Aucune conversation
          </p>
        ) : (
          <div className="flex flex-col gap-1 p-2">
            {threads.map((thread) => (
              <div
                key={thread.id}
                className={`group flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                  activeThreadId === thread.id
                    ? "bg-accent"
                    : "hover:bg-accent/50"
                }`}
                onClick={async () => handleSelectThread(thread.id)}
              >
                <MessageSquareIcon className="size-4 shrink-0" />
                <span className="flex-1 truncate">{thread.title}</span>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="opacity-0 group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    void handleDeleteThread(thread.id);
                  }}
                >
                  <TrashIcon className="size-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-0">
      {/* Sidebar desktop */}
      <div className="hidden w-72 shrink-0 border-r md:block">{threadList}</div>

      {/* Main chat area */}
      <div className="flex flex-1 flex-col">
        {/* Mobile header */}
        <div className="flex items-center gap-2 border-b p-2 md:hidden">
          <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon-sm">
                <MenuIcon />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetHeader className="border-b">
                <SheetTitle>Conversations</SheetTitle>
              </SheetHeader>
              {threadList}
            </SheetContent>
          </Sheet>
          <span className="text-sm font-medium">
            {activeThreadId
              ? (threads.find((t) => t.id === activeThreadId)?.title ??
                "Conversation")
              : "Assistant IA"}
          </span>
        </div>

        {/* Messages area */}
        {!activeThreadId ? (
          <EmptyState onCreateThread={handleCreateThread} />
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4">
              {messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-8 p-4">
                  <div className="text-center">
                    <p className="text-muted-foreground text-base font-medium">
                      👋 Bonjour ! Je suis ton assistant Jobio.
                    </p>
                    <p className="text-muted-foreground mt-1 text-sm">
                      Que puis-je faire pour toi ?
                    </p>
                  </div>
                  <SuggestedPromptsGrid
                    onSelectPrompt={(prompt) => {
                      void sendMessage({ text: prompt });
                    }}
                  />
                </div>
              ) : (
                <div className="m-auto flex max-w-3xl flex-col gap-4">
                  {messages.map((message) => (
                    <MessageBubble key={message.id} message={message} />
                  ))}
                  {isStreaming && (
                    <div className="flex items-center gap-2">
                      <BotIcon className="text-muted-foreground size-5" />
                      <Skeleton className="h-4 w-48" />
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            <ChatInput
              onSend={(text) => {
                void sendMessage({ text });
              }}
              isStreaming={isStreaming}
            />
          </>
        )}
      </div>
    </div>
  );
}

function EmptyState({ onCreateThread }: { onCreateThread: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
      <div className="bg-muted flex size-16 items-center justify-center rounded-full">
        <BotIcon className="text-muted-foreground size-8" />
      </div>
      <div className="text-center">
        <h2 className="text-lg font-semibold">Assistant IA Jobio</h2>
        <p className="text-muted-foreground mt-1 max-w-md text-sm">
          Pose des questions sur ton pipeline, tes missions, tes follow-ups. Je
          peux t&apos;aider a analyser ta recherche de missions freelance.
        </p>
      </div>
      <Button onClick={onCreateThread}>
        <PlusIcon />
        Commencer une conversation
      </Button>
    </div>
  );
}

function MessageBubble({ message }: { message: UIMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      <div
        className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
          isUser ? "bg-primary text-primary-foreground" : "bg-muted"
        }`}
      >
        {isUser ? (
          <UserIcon className="size-4" />
        ) : (
          <BotIcon className="size-4" />
        )}
      </div>
      <Card
        className={`max-w-[80%] px-4 py-3 ${
          isUser ? "bg-primary text-primary-foreground" : "bg-muted/50"
        }`}
      >
        {message.parts.map((part, i) => {
          if (part.type === "text" && part.text) {
            return isUser ? (
              <p key={i} className="text-sm whitespace-pre-wrap">
                {part.text}
              </p>
            ) : (
              <div
                key={i}
                className="prose prose-sm dark:prose-invert max-w-none"
              >
                <ReactMarkdown>{part.text}</ReactMarkdown>
              </div>
            );
          }
          return null;
        })}
      </Card>
    </div>
  );
}

function ChatInput({
  onSend,
  isStreaming,
}: {
  onSend: (text: string) => void;
  isStreaming: boolean;
}) {
  const [input, setInput] = useState("");

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;
    onSend(trimmed);
    setInput("");
  };

  return (
    <div className="border-t p-4">
      <div className="m-auto flex max-w-3xl gap-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          placeholder="Pose ta question..."
          className="min-h-10 resize-none"
          disabled={isStreaming}
        />
        <Button
          size="icon"
          onClick={handleSubmit}
          disabled={!input.trim() || isStreaming}
        >
          {isStreaming ? (
            <Loader2Icon className="animate-spin" />
          ) : (
            <SendIcon />
          )}
        </Button>
      </div>
    </div>
  );
}

function SuggestedPromptsGrid({
  onSelectPrompt,
}: {
  onSelectPrompt: (prompt: string) => void;
}) {
  return (
    <div className="grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {SUGGESTED_PROMPTS.map((item) => (
        <Button
          key={item.label}
          variant="outline"
          className="hover:bg-accent h-auto flex-col items-start gap-2 p-4 text-left"
          onClick={() => onSelectPrompt(item.prompt)}
        >
          <div className="text-accent-foreground">{item.icon}</div>
          <span className="text-sm font-medium">{item.label}</span>
        </Button>
      ))}
    </div>
  );
}
