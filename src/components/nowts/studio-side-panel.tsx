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
import { useCallback, useEffect, useRef, type ReactNode } from "react";

type StudioSidePanelProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  width?: number;
  onWidthChange?: (width: number) => void;
  minWidth?: number;
  maxWidth?: number;
};

const DEFAULT_WIDTH = 420;
const DEFAULT_MIN_WIDTH = 320;
const DEFAULT_MAX_WIDTH = 600;

export function StudioSidePanel({
  isOpen,
  onClose,
  title,
  children,
  footer,
  width = DEFAULT_WIDTH,
  onWidthChange,
  minWidth = DEFAULT_MIN_WIDTH,
  maxWidth = DEFAULT_MAX_WIDTH,
}: StudioSidePanelProps) {
  const isMobile = useIsMobile();
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(width);

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

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!onWidthChange) return;
      e.preventDefault();
      isDraggingRef.current = true;
      startXRef.current = e.clientX;
      startWidthRef.current = width;
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!isDraggingRef.current) return;
        const delta = startXRef.current - moveEvent.clientX;
        const newWidth = Math.min(
          maxWidth,
          Math.max(minWidth, startWidthRef.current + delta),
        );
        onWidthChange(newWidth);
      };

      const handleMouseUp = () => {
        isDraggingRef.current = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [maxWidth, minWidth, onWidthChange, width],
  );

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
      {onWidthChange ? (
        <div
          className="absolute top-0 left-0 z-50 h-full w-1 cursor-col-resize hover:bg-blue-500/30 active:bg-blue-500/50"
          onMouseDown={handleMouseDown}
        />
      ) : null}
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
