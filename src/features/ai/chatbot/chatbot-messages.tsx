"use client";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { UIMessage } from "ai";
import { AlertCircleIcon, BotIcon, UserIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";

type ChatbotMessagesProps = {
  messages: UIMessage[];
  isLoading: boolean;
  error?: Error | null;
};

export function ChatbotMessages({
  messages,
  isLoading,
  error,
}: ChatbotMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, error]);

  return (
    <div className="flex flex-col gap-3 p-4">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
      {isLoading && (
        <div className="flex items-start gap-2">
          <div className="bg-muted flex size-7 shrink-0 items-center justify-center rounded-full">
            <BotIcon className="size-3.5" />
          </div>
          <div className="flex flex-col gap-1.5 pt-1">
            <Skeleton className="h-3 w-36" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      )}
      {error && <ErrorBubble error={error} />}
      <div ref={messagesEndRef} />
    </div>
  );
}

function ErrorBubble({ error }: { error: Error }) {
  const { message, isQuotaError } = extractErrorInfo(error);

  return (
    <div className="flex items-start gap-2">
      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-950">
        <AlertCircleIcon className="size-3.5 text-red-600 dark:text-red-400" />
      </div>
      <Card className="max-w-[85%] border-red-200 bg-red-50 px-3 py-2 dark:border-red-900 dark:bg-red-950/50">
        <p className="text-sm text-red-800 dark:text-red-300">{message}</p>
        {isQuotaError && (
          <Link
            href="/pricing"
            className="mt-1.5 inline-block text-xs font-medium text-red-700 underline underline-offset-2 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200"
          >
            Voir les plans Pro
          </Link>
        )}
      </Card>
    </div>
  );
}

function extractErrorInfo(error: Error): {
  message: string;
  isQuotaError: boolean;
} {
  const raw = error.message;

  // useChat met le body de la réponse dans error.message — tenter de parser le JSON
  try {
    const parsed = JSON.parse(raw) as { error?: string };
    if (parsed.error) {
      const isQuota = parsed.error.includes("Limite atteinte");
      return { message: parsed.error, isQuotaError: isQuota };
    }
  } catch {
    // pas du JSON, on continue
  }

  if (raw.includes("Limite atteinte")) {
    return { message: raw, isQuotaError: true };
  }

  return {
    message: "Une erreur est survenue. Réessaie dans quelques instants.",
    isQuotaError: false,
  };
}

function MessageBubble({ message }: { message: UIMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      <div
        className={`flex size-7 shrink-0 items-center justify-center rounded-full ${
          isUser ? "bg-primary text-primary-foreground" : "bg-muted"
        }`}
      >
        {isUser ? (
          <UserIcon className="size-3.5" />
        ) : (
          <BotIcon className="size-3.5" />
        )}
      </div>
      <Card
        className={`max-w-[85%] px-3 py-2 ${
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
