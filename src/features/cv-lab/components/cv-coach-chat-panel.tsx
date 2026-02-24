"use client";

import ReactMarkdown from "react-markdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Send, UserIcon, BotIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { CvCoachProgressBar } from "./cv-coach-progress-bar";
import { CvCoachQuickQuestions } from "./cv-coach-quick-questions";
import {
  toDateTimeLabel,
  type CoachSessionDetails,
  type CoachMessage,
} from "../hooks/use-cv-coach-studio";
import type { CvCoachSnapshot } from "../cv-coach.schema";

type CvCoachChatPanelProps = {
  session: CoachSessionDetails;
  messageInput: string;
  onMessageInputChange: (v: string) => void;
  onSend: (text?: string) => Promise<void>;
  isSending: boolean;
  isStreaming: boolean;
  isExtracting: boolean;
  streamingText: string;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  onQuickQuestion: (q: string) => void;
  onOpenDossier: () => void;
  snapshot: CvCoachSnapshot | null;
};

export function CvCoachChatPanel({
  session,
  messageInput,
  onMessageInputChange,
  onSend,
  isSending,
  isStreaming,
  isExtracting,
  streamingText,
  messagesEndRef,
  onQuickQuestion,
  onOpenDossier,
  snapshot,
}: CvCoachChatPanelProps) {
  return (
    <div className="flex h-full flex-1 flex-col gap-3">
      {/* Progress Bar */}
      {snapshot ? (
        <div>
          <CvCoachProgressBar
            snapshot={snapshot}
            completenessScore={session.completenessScore}
          />
        </div>
      ) : null}

      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b pb-3">
        <div className="flex-1">
          <p className="truncate font-medium">{session.name}</p>
          {session.goalRole ? (
            <p className="text-muted-foreground text-xs">
              Cible: {session.goalRole}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Badge variant="outline">{session.status}</Badge>
          <Badge variant="secondary">{session.completenessScore}%</Badge>
          <Button variant="outline" size="sm" onClick={onOpenDossier}>
            Dossier
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="bg-muted/20 flex-1 overflow-y-auto rounded-md border p-3">
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

          {/* Extraction indicator */}
          {isExtracting ? (
            <div className="flex items-center gap-2">
              <div className="bg-muted flex size-7 items-center justify-center rounded-full">
                <BotIcon className="size-4" />
              </div>
              <div className="flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                <span className="text-muted-foreground text-xs">
                  Extraction des données...
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
    </div>
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
