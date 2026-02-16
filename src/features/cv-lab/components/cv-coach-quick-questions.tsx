"use client";

import { cn } from "@/lib/utils";
import { MessageCircleQuestion } from "lucide-react";

type CvCoachQuickQuestionsProps = {
  questions: string[];
  onSelectQuestion: (question: string) => void;
  disabled?: boolean;
};

export function CvCoachQuickQuestions({
  questions,
  onSelectQuestion,
  disabled = false,
}: CvCoachQuickQuestionsProps) {
  if (questions.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
        <MessageCircleQuestion className="size-3.5" />
        <span>Questions suggérées</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {questions.map((question, index) => (
          <button
            key={`${question}-${index}`}
            type="button"
            disabled={disabled}
            onClick={() => onSelectQuestion(question)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-left text-xs transition-colors",
              "hover:bg-primary/10 hover:border-primary/30",
              "disabled:pointer-events-none disabled:opacity-50",
              "cursor-pointer",
            )}
          >
            {question}
          </button>
        ))}
      </div>
    </div>
  );
}
