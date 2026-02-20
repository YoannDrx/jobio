"use client";

import { Button } from "@/components/ui/button";
import { BotIcon, HistoryIcon, MinusIcon, XIcon } from "lucide-react";
import { useChatbotStore } from "./chatbot-store";

export function ChatbotHeader() {
  const { close, view, setView } = useChatbotStore();

  return (
    <div className="bg-primary text-primary-foreground flex items-center gap-3 rounded-t-lg px-4 py-3">
      <div className="bg-primary-foreground/20 flex size-8 items-center justify-center rounded-full">
        <BotIcon className="size-4" />
      </div>
      <div className="flex-1">
        <p className="text-sm leading-tight font-semibold">Assistant Jobio</p>
        <p className="text-primary-foreground/70 text-xs">Ton assistant IA</p>
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon-xs"
          className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
          onClick={() => setView(view === "chat" ? "threads" : "chat")}
          aria-label="Historique"
        >
          <HistoryIcon className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10 hidden md:flex"
          onClick={close}
          aria-label="Minimiser"
        >
          <MinusIcon className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
          onClick={close}
          aria-label="Fermer"
        >
          <XIcon className="size-4" />
        </Button>
      </div>
    </div>
  );
}
