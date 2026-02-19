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
  emptyState?: ReactNode;
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
  emptyState,
}: DocumentStudioLayoutProps) {
  const isMobile = useIsMobile();

  if (emptyState) {
    return <div>{emptyState}</div>;
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
          <div className="flex justify-center py-4">{preview}</div>
          {bottomContent}
        </div>
      </div>

      <StudioSidePanel
        isOpen={editPanelOpen}
        onClose={() => onEditPanelOpenChange(false)}
        title={editPanelTitle}
        footer={editPanelFooter}
        width={editPanelWidth}
      >
        {editPanelContent}
      </StudioSidePanel>
    </>
  );
}
