"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = 1123;

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
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [scale, setScale] = useState(1);
  const [documentHeight, setDocumentHeight] = useState(A4_HEIGHT_PX);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setScale(Math.min(1, entry.contentRect.width / A4_WIDTH_PX));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const measureIframeHeight = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    try {
      const doc = iframe.contentDocument;
      if (!doc) return;

      const bodyHeight = doc.body.scrollHeight;
      const rootHeight = doc.documentElement.scrollHeight;
      const nextHeight = Math.max(A4_HEIGHT_PX, bodyHeight, rootHeight);

      setDocumentHeight((previous) =>
        Math.abs(previous - nextHeight) >= 2 ? nextHeight : previous,
      );
    } catch {
      // Ignore iframe measurement errors and keep default height.
    }
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

  useEffect(() => {
    setDocumentHeight(A4_HEIGHT_PX);
  }, [previewHtml]);

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

  const scaledWidth = A4_WIDTH_PX * scale;
  const scaledHeight = documentHeight * scale;
  const scaledA4Height = A4_HEIGHT_PX * scale;
  const pageBreakOffsets: number[] = [];
  if (documentHeight > A4_HEIGHT_PX + 1) {
    for (
      let offset = scaledA4Height;
      offset < scaledHeight - 1;
      offset += scaledA4Height
    ) {
      pageBreakOffsets.push(offset);
    }
  }

  return (
    <div ref={containerRef} className="w-full">
      {isPreviewLoading ? (
        <p className="text-muted-foreground mb-2 text-xs">
          Mise à jour de la prévisualisation...
        </p>
      ) : null}
      <div className="bg-muted/30 rounded-md p-2">
        <div
          className="relative mx-auto overflow-hidden rounded-sm bg-white shadow-xl"
          style={{
            width: scaledWidth,
            height: scaledHeight,
          }}
        >
          {pageBreakOffsets.map((offset, index) => (
            <div
              key={`page-break-${index}`}
              className="pointer-events-none absolute inset-x-0 z-10"
              style={{ top: offset }}
            >
              <div className="absolute -top-px left-0 h-[2px] w-7 rounded-r-full bg-slate-400/70" />
              <div className="absolute -top-px right-0 h-[2px] w-7 rounded-l-full bg-slate-400/70" />
              <div className="absolute -top-3 right-9 rounded-full bg-slate-700/75 px-2 py-0.5 text-[10px] font-medium text-white">
                A4 {index + 2}
              </div>
            </div>
          ))}
          <iframe
            ref={iframeRef}
            title="cv-preview"
            srcDoc={previewHtml}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: A4_WIDTH_PX,
              height: documentHeight,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
              border: "none",
            }}
            onLoad={() => {
              measureIframeHeight();
              window.requestAnimationFrame(measureIframeHeight);
              window.setTimeout(measureIframeHeight, 120);
              window.setTimeout(measureIframeHeight, 420);
            }}
          />
        </div>
      </div>
    </div>
  );
}
