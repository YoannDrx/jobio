import {
  resolveCvContent,
  resolveCvContentFromProfile,
} from "@/features/cv-lab/cv-content-resolver";
import { generateCvPdfBuffer } from "@/features/cv-lab/cv-pdf";
import { renderCvLabHtml } from "@/features/cv-lab/cv-renderer";
import { prisma } from "@/lib/prisma";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

const querySchema = z.object({
  mode: z.enum(["preview", "pdf"]).optional().default("preview"),
  download: z.coerce.boolean().optional().default(false),
});

type RouteContext = {
  params: Promise<{ token: string }>;
};

const defaultHeaders = {
  "Cache-Control": "no-store, max-age=0",
  "X-Robots-Tag": "noindex, nofollow",
};

const safeFilename = (value: string) =>
  value
    .trim()
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "cv";

const toJsonError = (status: number, message: string) =>
  NextResponse.json(
    { message },
    {
      status,
      headers: defaultHeaders,
    },
  );

const injectPublicShell = (params: {
  html: string;
  token: string;
}) => {
  const pdfUrl = `/p/cv/${encodeURIComponent(params.token)}?mode=pdf&download=true`;
  const headMarkup = `
  <link rel="icon" href="/icon.png" sizes="any" />
  <link rel="shortcut icon" href="/icon.png" />
`;

  const actionsMarkup = `
  <style>
    .cv-share-actions {
      position: fixed;
      top: 14px;
      right: 14px;
      z-index: 9999;
      display: flex;
      gap: 8px;
      align-items: center;
      background: rgba(255, 255, 255, 0.95);
      border: 1px solid rgba(148, 163, 184, 0.4);
      border-radius: 10px;
      padding: 8px;
      box-shadow: 0 6px 18px rgba(2, 6, 23, 0.14);
      backdrop-filter: blur(2px);
    }
    .cv-share-btn {
      appearance: none;
      border: 1px solid rgba(148, 163, 184, 0.45);
      border-radius: 8px;
      background: #ffffff;
      color: #0f172a;
      font: 600 12px/1.2 "Inter", "Segoe UI", sans-serif;
      padding: 8px 10px;
      text-decoration: none;
      cursor: pointer;
      white-space: nowrap;
    }
    .cv-share-btn:hover {
      background: #f8fafc;
    }
    @media (max-width: 720px) {
      .cv-share-actions {
        left: 8px;
        right: 8px;
        top: 8px;
        justify-content: space-between;
      }
      .cv-share-btn {
        flex: 1;
        text-align: center;
      }
    }
    @media print {
      .cv-share-actions {
        display: none !important;
      }
    }
  </style>
  <div class="cv-share-actions" aria-label="Actions de partage CV">
    <a class="cv-share-btn" href="${pdfUrl}">Télécharger au format PDF</a>
    <button class="cv-share-btn" id="cv-share-print-button" type="button">Imprimer</button>
  </div>
  <script>
    (function() {
      var printButton = document.getElementById("cv-share-print-button");
      if (!printButton) return;
      printButton.addEventListener("click", function () {
        window.print();
      });
    })();
  </script>
`;

  const withHead = params.html.includes("</head>")
    ? params.html.replace("</head>", `${headMarkup}</head>`)
    : `${headMarkup}${params.html}`;

  if (withHead.includes("</body>")) {
    return withHead.replace("</body>", `${actionsMarkup}</body>`);
  }

  return `${withHead}${actionsMarkup}`;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const { token } = await context.params;

  const parsedQuery = querySchema.safeParse({
    mode: request.nextUrl.searchParams.get("mode") ?? undefined,
    download: request.nextUrl.searchParams.get("download") ?? undefined,
  });

  if (!parsedQuery.success) {
    return toJsonError(400, "Paramètres de rendu invalides");
  }

  if (!token || token.length < 10) {
    return toJsonError(404, "CV introuvable");
  }

  const document = await prisma.cvLabDocument.findFirst({
    where: {
      shareToken: token,
      archivedAt: null,
    },
    include: {
      profile: true,
      masterCv: true,
      user: {
        select: {
          image: true,
        },
      },
    },
  });

  if (!document) {
    return toJsonError(404, "CV introuvable");
  }

  const documentOverrides = {
    contentOverrides: document.contentOverrides,
    hiddenItems: document.hiddenItems,
    personalInfo: document.personalInfo,
  };

  const resolvedContent = document.masterCv
    ? resolveCvContent(document.masterCv, documentOverrides)
    : resolveCvContentFromProfile(document.profile, documentOverrides);
  const content = {
    ...resolvedContent,
    photoUrl: resolvedContent.photoUrl ?? document.user.image ?? null,
  };

  const html = renderCvLabHtml(document, content, {
    autoPrint: false,
  });

  if (parsedQuery.data.mode === "pdf") {
    try {
      const pdf = await generateCvPdfBuffer(html);

      return new NextResponse(new Uint8Array(pdf), {
        headers: {
          ...defaultHeaders,
          "Content-Type": "application/pdf",
          "Content-Disposition": `${parsedQuery.data.download ? "attachment" : "inline"}; filename="${safeFilename(document.name)}.pdf"`,
        },
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Impossible de générer le PDF";
      return toJsonError(503, message);
    }
  }

  const htmlWithActions = injectPublicShell({ html, token });

  return new NextResponse(htmlWithActions, {
    headers: {
      ...defaultHeaders,
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}
