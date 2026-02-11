"use client";

import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";

type EmailPreviewProps = {
  body: string;
};

const markdownComponents: Components = {
  h1: ({ children }) => (
    <h3 style={{ margin: "12px 0 4px", fontSize: "18px", fontWeight: 600 }}>
      {children}
    </h3>
  ),
  h2: ({ children }) => (
    <h3 style={{ margin: "12px 0 4px", fontSize: "16px", fontWeight: 600 }}>
      {children}
    </h3>
  ),
  h3: ({ children }) => (
    <h4 style={{ margin: "8px 0 4px", fontSize: "14px", fontWeight: 600 }}>
      {children}
    </h4>
  ),
  a: ({ href, children }) => (
    <a href={href} style={{ color: "#2563eb", textDecoration: "underline" }}>
      {children}
    </a>
  ),
  p: ({ children }) => <p style={{ margin: "0 0 8px" }}>{children}</p>,
};

export function EmailPreview({ body }: EmailPreviewProps) {
  if (!body.trim()) {
    return (
      <div className="text-muted-foreground flex min-h-[200px] items-center justify-center rounded-md border bg-white p-6 text-sm">
        Aucun contenu a previsualiser
      </div>
    );
  }

  return (
    <div className="min-h-[200px] rounded-md border bg-white p-6 text-sm leading-relaxed text-black">
      <ReactMarkdown components={markdownComponents}>{body}</ReactMarkdown>
    </div>
  );
}
