"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { BotIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import {
  getChatThreadsAction,
  getChatThreadAction,
  createChatThreadAction,
  deleteChatThreadAction,
} from "@/features/ai/chat/chat.action";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useChatbotStore } from "./chatbot-store";
import { ChatbotHeader } from "./chatbot-header";
import { ChatbotMessages } from "./chatbot-messages";
import { ChatbotInput } from "./chatbot-input";
import { ChatbotSuggestedPrompts } from "./chatbot-suggested-prompts";
import { ChatbotThreadList } from "./chatbot-thread-list";

type ChatThread = {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
};

function ChatbotWindowContent() {
  const {
    isOpen,
    view,
    setView,
    activeThreadId,
    setActiveThreadId,
    showSuggestions,
    setShowSuggestions,
  } = useChatbotStore();

  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [isLoadingThreads, setIsLoadingThreads] = useState(true);

  const { messages, sendMessage, status, setMessages, error } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/ai/chat",
      body: { threadId: activeThreadId },
    }),
  });

  const isLoading = status === "streaming" || status === "submitted";

  const loadThreads = useCallback(async () => {
    try {
      const result = await resolveActionResult(getChatThreadsAction());
      setThreads(result);
    } finally {
      setIsLoadingThreads(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      void loadThreads();
    }
  }, [isOpen, loadThreads]);

  const handleCreateThread = async () => {
    const thread = await resolveActionResult(
      createChatThreadAction({ title: undefined }),
    );
    setThreads((prev) => [thread, ...prev]);
    setActiveThreadId(thread.id);
    setMessages([]);
    setView("chat");
    setShowSuggestions(false);
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
    setView("chat");
    setShowSuggestions(false);
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

  const handleSend = (text: string) => {
    setShowSuggestions(false);
    if (!activeThreadId) {
      // Auto-create a thread on first message
      void createChatThreadAction({ title: undefined }).then(async (result) => {
        const thread = await resolveActionResult(Promise.resolve(result));
        setThreads((prev) => [thread, ...prev]);
        setActiveThreadId(thread.id);
        // Send after thread is set — useChat will pick up threadId from store
        void sendMessage({ text });
      });
      return;
    }
    void sendMessage({ text });
  };

  const handleSelectPrompt = (prompt: string) => {
    setShowSuggestions(false);
    handleSend(prompt);
  };

  const showEmptyState = !activeThreadId && messages.length === 0;
  const showSuggestionsPanel =
    showSuggestions || (activeThreadId && messages.length === 0);

  const content = (
    <div className="flex h-full flex-col overflow-hidden">
      <ChatbotHeader />

      {view === "threads" ? (
        <ChatbotThreadList
          threads={threads}
          isLoading={isLoadingThreads}
          onCreateThread={() => void handleCreateThread()}
          onSelectThread={(id) => void handleSelectThread(id)}
          onDeleteThread={(id) => void handleDeleteThread(id)}
        />
      ) : (
        <>
          <div className="flex-1 overflow-y-auto">
            {showEmptyState ? (
              <div className="flex h-full flex-col items-center justify-center gap-4 p-6">
                <div className="bg-muted flex size-12 items-center justify-center rounded-full">
                  <BotIcon className="text-muted-foreground size-6" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">
                    Salut ! Je suis ton Assistant Jobio
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    Que puis-je faire pour toi ?
                  </p>
                </div>
                <ChatbotSuggestedPrompts onSelectPrompt={handleSelectPrompt} />
              </div>
            ) : (
              <>
                <ChatbotMessages
                  messages={messages}
                  isLoading={isLoading}
                  error={error}
                />
                {showSuggestionsPanel && (
                  <ChatbotSuggestedPrompts
                    onSelectPrompt={handleSelectPrompt}
                  />
                )}
              </>
            )}
          </div>

          <ChatbotInput
            onSend={handleSend}
            isLoading={isLoading}
            onToggleSuggestions={() => setShowSuggestions(!showSuggestions)}
          />
        </>
      )}
    </div>
  );

  return content;
}

export function ChatbotWindow() {
  const { isOpen, close } = useChatbotStore();
  const isMobile = useIsMobile();

  if (!isOpen) return null;

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
        <SheetContent side="bottom" className="h-[100dvh] p-0" hideCloseButton>
          <ChatbotWindowContent />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div
      className="animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2 bg-background fixed right-6 bottom-24 z-40 flex h-[600px] w-[420px] flex-col overflow-hidden rounded-lg border shadow-xl duration-200"
      style={{ maxHeight: "calc(100vh - 120px)" }}
    >
      <ChatbotWindowContent />
    </div>
  );
}
