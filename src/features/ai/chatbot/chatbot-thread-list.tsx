"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeftIcon,
  MessageSquareIcon,
  PlusIcon,
  TrashIcon,
} from "lucide-react";
import { useChatbotStore } from "./chatbot-store";

type ChatThread = {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
};

type ChatbotThreadListProps = {
  threads: ChatThread[];
  isLoading: boolean;
  onCreateThread: () => void;
  onSelectThread: (threadId: string) => void;
  onDeleteThread: (threadId: string) => void;
};

export function ChatbotThreadList({
  threads,
  isLoading,
  onCreateThread,
  onSelectThread,
  onDeleteThread,
}: ChatbotThreadListProps) {
  const { activeThreadId, setView } = useChatbotStore();

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b p-3">
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => setView("chat")}
          aria-label="Retour"
        >
          <ArrowLeftIcon className="size-4" />
        </Button>
        <span className="flex-1 text-sm font-medium">Conversations</span>
        <Button variant="outline" size="xs" onClick={onCreateThread}>
          <PlusIcon className="size-3.5" />
          Nouveau
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex flex-col gap-2 p-3">
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
                onClick={() => onSelectThread(thread.id)}
              >
                <MessageSquareIcon className="size-4 shrink-0" />
                <span className="flex-1 truncate">{thread.title}</span>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="opacity-0 group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteThread(thread.id);
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
}
