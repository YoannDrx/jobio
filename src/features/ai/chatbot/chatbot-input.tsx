"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2Icon, SendIcon, SparklesIcon } from "lucide-react";
import { useState } from "react";

type ChatbotInputProps = {
  onSend: (text: string) => void;
  isLoading: boolean;
  onToggleSuggestions: () => void;
};

export function ChatbotInput({
  onSend,
  isLoading,
  onToggleSuggestions,
}: ChatbotInputProps) {
  const [input, setInput] = useState("");

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed);
    setInput("");
  };

  return (
    <div className="border-t p-3">
      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onToggleSuggestions}
          className="text-muted-foreground hover:text-foreground shrink-0 self-end"
          aria-label="Suggestions"
        >
          <SparklesIcon className="size-4" />
        </Button>
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
          className="max-h-24 min-h-9 resize-none text-sm"
          disabled={isLoading}
          rows={1}
        />
        <Button
          size="icon-xs"
          onClick={handleSubmit}
          disabled={!input.trim() || isLoading}
          className="shrink-0 self-end"
        >
          {isLoading ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : (
            <SendIcon className="size-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
