"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { useCallback, useEffect } from "react";
import { Bold, Italic, List, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type RichTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
  _placeholder?: string;
  className?: string;
};

const toMarkdown = (html: string): string => {
  if (!html || html === "<p></p>") return "";

  return html
    .replace(/<p><\/p>/g, "\n")
    .replace(/<p>/g, "")
    .replace(/<\/p>/g, "\n")
    .replace(/<strong>/g, "**")
    .replace(/<\/strong>/g, "**")
    .replace(/<em>/g, "*")
    .replace(/<\/em>/g, "*")
    .replace(/<ul>/g, "")
    .replace(/<\/ul>/g, "")
    .replace(/<li>/g, "- ")
    .replace(/<\/li>/g, "\n")
    .replace(/<a[^>]*href="([^"]*)"[^>]*>/g, "[")
    .replace(/<\/a>/g, (_, _offset, str) => {
      const beforeClose = str.substring(0, str.indexOf("</a>"));
      const hrefMatch = beforeClose.match(/href="([^"]*)"/);
      return `](${hrefMatch?.[1] ?? ""})`;
    })
    .replace(/<br\s*\/?>/g, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

const fromMarkdown = (markdown: string): string => {
  if (!markdown) return "";

  return markdown
    .split("\n")
    .map((line) => {
      let processed = line;
      // Bold
      processed = processed.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
      // Italic
      processed = processed.replace(/\*(.+?)\*/g, "<em>$1</em>");
      // Links
      processed = processed.replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
      );
      // List items
      if (processed.startsWith("- ")) {
        return `<li>${processed.slice(2)}</li>`;
      }
      return `<p>${processed}</p>`;
    })
    .join("")
    .replace(/(<li>.*<\/li>)+/g, (match) => `<ul>${match}</ul>`)
    .replace(/<p><\/p>/g, "");
};

export function RichTextEditor({
  value,
  onChange,
  _placeholder,
  className,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        codeBlock: false,
        code: false,
        horizontalRule: false,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          target: "_blank",
          rel: "noopener noreferrer",
        },
      }),
    ],
    content: fromMarkdown(value),
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm max-w-none min-h-[80px] px-3 py-2 focus:outline-none",
          "[&_ul]:list-disc [&_ul]:pl-4 [&_p]:my-1 [&_li]:my-0.5",
        ),
        "aria-label": "Éditeur de texte riche",
        role: "textbox",
        "aria-multiline": "true",
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange(toMarkdown(ed.getHTML()));
    },
  });

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!editor) return;
    const currentMarkdown = toMarkdown(editor.getHTML());
    if (currentMarkdown !== value) {
      editor.commands.setContent(fromMarkdown(value));
    }
  }, [value, editor]);

  const setLink = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL du lien:", previousUrl ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!editor) {
    return null;
  }

  return (
    <div
      className={cn(
        "focus-within:ring-ring rounded-md border focus-within:ring-1",
        className,
      )}
    >
      <div
        className="flex gap-0.5 border-b px-1 py-1"
        role="toolbar"
        aria-label="Barre d'outils de mise en forme"
      >
        <Button
          type="button"
          variant={editor.isActive("bold") ? "secondary" : "ghost"}
          size="icon-xs"
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Gras"
          aria-label="Gras"
          aria-pressed={editor.isActive("bold")}
        >
          <Bold className="size-3.5" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive("italic") ? "secondary" : "ghost"}
          size="icon-xs"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italique"
          aria-label="Italique"
          aria-pressed={editor.isActive("italic")}
        >
          <Italic className="size-3.5" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive("bulletList") ? "secondary" : "ghost"}
          size="icon-xs"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Liste a puces"
          aria-label="Liste à puces"
          aria-pressed={editor.isActive("bulletList")}
        >
          <List className="size-3.5" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive("link") ? "secondary" : "ghost"}
          size="icon-xs"
          onClick={setLink}
          title="Lien"
          aria-label="Lien"
          aria-pressed={editor.isActive("link")}
        >
          <LinkIcon className="size-3.5" />
        </Button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
