"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Check, Copy, Lightbulb } from "lucide-react";
import { useState } from "react";

type TemplateDetailSheetProps = {
  template: {
    id: string;
    title: string;
    hook: string;
    body: string | null;
    tips: string | null;
    category?: string | null;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function TemplateDetailSheet({
  template,
  open,
  onOpenChange,
}: TemplateDetailSheetProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!template?.body) return;
    await navigator.clipboard.writeText(template.body);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{template?.title ?? "Template"}</SheetTitle>
          {template?.category && (
            <Badge variant="secondary" className="w-fit">
              {template.category}
            </Badge>
          )}
        </SheetHeader>

        {template?.body && (
          <div className="flex flex-col gap-6 p-4">
            {/* Post content */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">Le post</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void handleCopy()}
                  className="gap-2"
                >
                  {copied ? (
                    <>
                      <Check className="size-3.5" />
                      Copié !
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5" />
                      Copier le post
                    </>
                  )}
                </Button>
              </div>
              <div className="bg-muted rounded-lg p-4">
                <pre className="font-sans text-sm leading-relaxed whitespace-pre-wrap">
                  {template.body}
                </pre>
              </div>
            </div>

            {/* Tips */}
            {template.tips && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <Lightbulb className="size-4 text-amber-500" />
                  <h4 className="text-sm font-semibold">
                    Conseils d&apos;utilisation
                  </h4>
                </div>
                <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
                  <pre className="font-sans text-sm leading-relaxed whitespace-pre-wrap">
                    {template.tips}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
