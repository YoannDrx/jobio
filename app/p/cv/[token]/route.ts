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

  const content = document.masterCv
    ? resolveCvContent(document.masterCv, documentOverrides)
    : resolveCvContentFromProfile(document.profile, documentOverrides);

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

  return new NextResponse(html, {
    headers: {
      ...defaultHeaders,
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}
