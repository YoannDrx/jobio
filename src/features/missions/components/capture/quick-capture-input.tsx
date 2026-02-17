"use client";

import { Input } from "@/components/ui/input";
import { LoadingButton } from "@/features/form/submit-button";
import { Sparkles } from "lucide-react";
import { useState } from "react";

type QuickCaptureInputProps = {
  onParse: (source: "url" | "text", content: string) => void;
  isLoading?: boolean;
};

export function QuickCaptureInput({
  onParse,
  isLoading,
}: QuickCaptureInputProps) {
  const [value, setValue] = useState("");

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed) return;

    const isUrl = /^https?:\/\/.+/.test(trimmed);
    onParse(isUrl ? "url" : "text", trimmed);
  };

  return (
    <div className="flex gap-2">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Colle une URL ou du texte d'annonce..."
        className="flex-1"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            handleSubmit();
          }
        }}
      />
      <LoadingButton
        loading={isLoading}
        onClick={handleSubmit}
        disabled={!value.trim()}
      >
        <Sparkles className="size-4" />
        Parser
      </LoadingButton>
    </div>
  );
}
