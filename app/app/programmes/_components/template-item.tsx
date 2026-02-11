"use client";

import { Lock, ChevronRight } from "lucide-react";

type TemplateItemProps = {
  template: {
    id: string;
    title: string;
    hook: string;
    body: string | null;
    category?: string | null;
    order: number;
  };
  isUnlocked: boolean;
  onClick: () => void;
};

export function TemplateItem({
  template,
  isUnlocked,
  onClick,
}: TemplateItemProps) {
  return (
    <button
      onClick={onClick}
      disabled={!isUnlocked}
      className="border-border hover:bg-muted/50 flex w-full items-start gap-4 border-b px-4 py-4 text-left transition-colors last:border-b-0 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <div className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-medium">
        {template.order}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium">{template.title}</p>
        <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
          {template.hook}
        </p>
      </div>
      <div className="shrink-0 pt-1">
        {isUnlocked ? (
          <ChevronRight className="text-muted-foreground size-5" />
        ) : (
          <Lock className="text-muted-foreground size-4" />
        )}
      </div>
    </button>
  );
}
