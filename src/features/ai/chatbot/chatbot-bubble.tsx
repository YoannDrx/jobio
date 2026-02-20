"use client";

import { BotIcon } from "lucide-react";
import { useChatbotStore } from "./chatbot-store";

export function ChatbotBubble() {
  const { toggle, hasUnread } = useChatbotStore();

  return (
    <button
      onClick={toggle}
      className="bg-primary text-primary-foreground fixed right-6 bottom-6 z-40 flex size-14 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95 max-md:right-4 max-md:bottom-4 max-md:size-12 md:size-14"
      aria-label="Ouvrir l'Assistant Jobio"
    >
      <BotIcon className="size-6 max-md:size-5" />
      {hasUnread && (
        <span className="absolute top-0 right-0 size-3 rounded-full bg-red-500 ring-2 ring-white" />
      )}
    </button>
  );
}
