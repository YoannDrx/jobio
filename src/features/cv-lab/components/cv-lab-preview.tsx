"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type CvLabPreviewProps = {
  previewHtml: string | null;
  previewError: string | null;
  isPreviewLoading: boolean;
  onSectionClick?: (section: string) => void;
};

export function CvLabPreview({
  previewHtml,
  previewError,
  isPreviewLoading,
  onSectionClick,
}: CvLabPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setScale(Math.min(1, entry.contentRect.width / 794));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleMessage = useCallback(
    (event: MessageEvent) => {
      if (event.data?.type === "cv-section-click" && event.data.section) {
        onSectionClick?.(event.data.section);
      }
    },
    [onSectionClick],
  );

  useEffect(() => {
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [handleMessage]);

  if (previewError) {
    return (
      <div className="w-full max-w-[794px]">
        <p className="text-destructive text-sm">{previewError}</p>
      </div>
    );
  }

  if (!previewHtml) {
    return (
      <div className="w-full max-w-[794px]">
        <p className="text-muted-foreground text-sm">
          Génération de la prévisualisation...
        </p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full max-w-[794px]">
      {isPreviewLoading ? (
        <p className="text-muted-foreground mb-2 text-xs">
          Mise à jour de la prévisualisation...
        </p>
      ) : null}
      <div
        className="relative overflow-hidden rounded-sm bg-white shadow-xl"
        style={{ paddingBottom: `${(297 / 210) * 100}%` }}
      >
        <iframe
          title="cv-preview"
          srcDoc={previewHtml}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 794,
            height: 1123,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            border: "none",
          }}
        />
      </div>
    </div>
  );
}
