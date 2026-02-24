"use client";

import { ChevronRight, Lock } from "lucide-react";

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
  accentColor?: string;
};

export function TemplateItem({
  template,
  isUnlocked,
  onClick,
  accentColor,
}: TemplateItemProps) {
  return (
    <button
      onClick={onClick}
      disabled={!isUnlocked}
      className="hover:bg-muted/50 group/item flex w-full items-start gap-4 px-5 py-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50"
    >
      <div
        className={`flex size-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
          accentColor ?? "bg-primary/10 text-primary"
        }`}
      >
        {template.order}
      </div>
      <div className="min-w-0 flex-1">
        <p className="leading-tight font-medium">{template.title}</p>
        <p className="text-muted-foreground mt-1.5 line-clamp-2 text-sm leading-relaxed">
          {template.hook}
        </p>
      </div>
      <div className="shrink-0 pt-0.5">
        {isUnlocked ? (
          <ChevronRight className="text-muted-foreground size-5 transition-transform group-hover/item:translate-x-0.5" />
        ) : (
          <Lock className="text-muted-foreground/50 size-4" />
        )}
      </div>
    </button>
  );
}
