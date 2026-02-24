"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Sparkles, X } from "lucide-react";

type TagInputProps = {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder: string;
  onSuggest?: () => Promise<string[]>;
};

export function TagInput({
  tags,
  onChange,
  placeholder,
  onSuggest,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);

  const addTag = () => {
    const trimmed = inputValue.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setInputValue("");
  };

  const addMultipleTags = (value: string) => {
    const newTags = value
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t && !tags.includes(t));
    if (newTags.length > 0) {
      onChange([...tags, ...newTags]);
    }
    setInputValue("");
  };

  const handleSuggest = async () => {
    if (!onSuggest) return;
    setIsSuggesting(true);
    try {
      const result = await onSuggest();
      setSuggestions(result.filter((s) => !tags.includes(s)));
    } catch {
      // Ignore suggestion errors
    } finally {
      setIsSuggesting(false);
    }
  };

  const acceptSuggestion = (suggestion: string) => {
    if (!tags.includes(suggestion)) {
      onChange([...tags, suggestion]);
    }
    setSuggestions((prev) => prev.filter((s) => s !== suggestion));
  };

  return (
    <div className="flex flex-col gap-2">
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1">
              {tag}
              <button
                type="button"
                onClick={() => onChange(tags.filter((t) => t !== tag))}
                className="ml-0.5"
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={placeholder}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (inputValue.includes(",")) {
                addMultipleTags(inputValue);
              } else {
                addTag();
              }
            }
          }}
          onPaste={(e) => {
            const pastedText = e.clipboardData.getData("text");
            if (pastedText.includes(",")) {
              e.preventDefault();
              addMultipleTags(pastedText);
            }
          }}
        />
        <Button variant="outline" size="sm" onClick={addTag} type="button">
          <Plus className="size-3.5" />
        </Button>
        {onSuggest ? (
          <Button
            variant="outline"
            size="sm"
            onClick={handleSuggest}
            disabled={isSuggesting}
            type="button"
            title="Suggestions IA"
          >
            {isSuggesting ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Sparkles className="size-3.5" />
            )}
          </Button>
        ) : null}
      </div>
      {suggestions.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {suggestions.map((suggestion) => (
            <Badge
              key={suggestion}
              variant="outline"
              className="hover:bg-primary/10 cursor-pointer gap-1 transition-colors"
              onClick={() => acceptSuggestion(suggestion)}
            >
              <Plus className="size-2.5" />
              {suggestion}
            </Badge>
          ))}
        </div>
      ) : null}
    </div>
  );
}
