"use client";

import { StudioSidePanel } from "@/components/nowts/studio-side-panel";
import { useIsMobile } from "@/hooks/use-mobile";
import type { ReactNode } from "react";

type DocumentStudioLayoutProps = {
  toolbar: ReactNode;
  preview: ReactNode;
  bottomContent?: ReactNode;
  editPanelOpen: boolean;
  onEditPanelOpenChange: (open: boolean) => void;
  editPanelTitle: string;
  editPanelContent: ReactNode;
  editPanelFooter?: ReactNode;
  editPanelWidth?: number;
  onEditPanelWidthChange?: (width: number) => void;
  emptyState?: ReactNode;
  contentMode?: "centered" | "full";
};

export function DocumentStudioLayout({
  toolbar,
  preview,
  bottomContent,
  editPanelOpen,
  onEditPanelOpenChange,
  editPanelTitle,
  editPanelContent,
  editPanelFooter,
  editPanelWidth = 420,
  onEditPanelWidthChange,
  emptyState,
  contentMode = "centered",
}: DocumentStudioLayoutProps) {
  const isMobile = useIsMobile();

  if (emptyState) {
    return (
      <div className="flex flex-col gap-3">
        {toolbar}
        {emptyState}
      </div>
    );
  }

  return (
    <>
      <div
        className="transition-[padding-right] duration-300 ease-out"
        style={{
          paddingRight: !isMobile && editPanelOpen ? editPanelWidth : 0,
        }}
      >
        <div className="flex flex-col gap-3">
          {toolbar}
          <div
            className={
              contentMode === "full"
                ? "flex flex-1 flex-col p-4"
                : "flex justify-center py-4"
            }
          >
            {preview}
          </div>
          {bottomContent}
        </div>
      </div>

      <StudioSidePanel
        isOpen={editPanelOpen}
        onClose={() => onEditPanelOpenChange(false)}
        title={editPanelTitle}
        footer={editPanelFooter}
        width={editPanelWidth}
        onWidthChange={onEditPanelWidthChange}
      >
        {editPanelContent}
      </StudioSidePanel>
    </>
  );
}
