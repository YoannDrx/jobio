"use client";

type EmailPreviewProps = {
  body: string;
};

function renderMarkdown(text: string): string {
  return text
    .split("\n")
    .map((line) => {
      let html = line;
      html = html.replace(
        /^### (.+)$/,
        "<h4 style='margin:8px 0 4px;font-size:14px;font-weight:600'>$1</h4>",
      );
      html = html.replace(
        /^## (.+)$/,
        "<h3 style='margin:12px 0 4px;font-size:16px;font-weight:600'>$1</h3>",
      );
      html = html.replace(
        /^# (.+)$/,
        "<h3 style='margin:12px 0 4px;font-size:18px;font-weight:600'>$1</h3>",
      );
      html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
      html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
      html = html.replace(
        /\[(.+?)\]\((.+?)\)/g,
        '<a href="$2" style="color:#2563eb;text-decoration:underline">$1</a>',
      );
      if (html === line && !html.startsWith("<h")) {
        html = html || "<br>";
      }
      return html;
    })
    .join("<br>");
}

export function EmailPreview({ body }: EmailPreviewProps) {
  if (!body.trim()) {
    return (
      <div className="text-muted-foreground flex min-h-[200px] items-center justify-center rounded-md border bg-white p-6 text-sm">
        Aucun contenu a previsualiser
      </div>
    );
  }

  return (
    <div
      className="min-h-[200px] rounded-md border bg-white p-6 text-sm leading-relaxed text-black"
      dangerouslySetInnerHTML={{ __html: renderMarkdown(body) }}
    />
  );
}
