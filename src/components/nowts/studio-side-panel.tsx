"use client";

import { Button } from "@/components/ui/button";
import {
  EditSideSheet,
  EditSideSheetBody,
  EditSideSheetContent,
  EditSideSheetFooter,
  EditSideSheetHeader,
} from "@/components/nowts/edit-side-sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { useCallback, useEffect, type ReactNode } from "react";

type StudioSidePanelProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  width?: number;
};

export function StudioSidePanel({
  isOpen,
  onClose,
  title,
  children,
  footer,
  width = 420,
}: StudioSidePanelProps) {
  const isMobile = useIsMobile();

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (isOpen) document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, handleEscape]);

  if (isMobile) {
    return (
      <EditSideSheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <EditSideSheetContent>
          <EditSideSheetHeader title={title} />
          <EditSideSheetBody>{children}</EditSideSheetBody>
          {footer ? <EditSideSheetFooter>{footer}</EditSideSheetFooter> : null}
        </EditSideSheetContent>
      </EditSideSheet>
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="false"
      className={cn(
        "bg-background fixed top-0 right-0 z-40 flex h-full flex-col border-l shadow-2xl",
        "transform transition-transform duration-300 ease-out",
        isOpen ? "translate-x-0" : "translate-x-full",
      )}
      style={{ width }}
    >
      <div className="flex items-center justify-between border-b px-4 py-3">
        <p className="text-sm font-semibold">{title}</p>
        <Button variant="ghost" size="icon-sm" onClick={onClose}>
          <X className="size-4" />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">{children}</div>
      {footer ? <div className="border-t px-4 py-3">{footer}</div> : null}
    </div>
  );
}
