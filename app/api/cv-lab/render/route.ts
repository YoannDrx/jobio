import { authRoute } from "@/lib/zod-route";
import { prisma } from "@/lib/prisma";
import { ZodRouteError } from "@/lib/errors/zod-route-error";
import { renderCvLabHtml } from "@/features/cv-lab/cv-renderer";
import { generateCvPdfBuffer } from "@/features/cv-lab/cv-pdf";
import {
  CV_LAB_PAGE_SIZES,
  CV_LAB_SECTIONS,
  CV_LAB_TEMPLATES,
  CV_LAB_THEMES,
} from "@/features/cv-lab/cv-lab.schema";
import { z } from "zod";

const renderModeSchema = z.enum(["preview", "pdf"]);

const querySchema = z.object({
  documentId: z.string().min(1),
  mode: renderModeSchema.optional().default("preview"),
  download: z.coerce.boolean().optional().default(false),
});

const cvLabSnapshotSchema = z.object({
  profileId: z.string().min(1).optional(),
  name: z.string().trim().min(2).max(80).optional(),
  targetRole: z.string().trim().max(120).nullable().optional(),
  template: z.enum(CV_LAB_TEMPLATES).optional(),
  theme: z.enum(CV_LAB_THEMES).optional(),
  pageSize: z.enum(CV_LAB_PAGE_SIZES).optional(),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  fontFamily: z.string().trim().min(2).max(40).optional(),
  headlineOverride: z.string().trim().max(180).nullable().optional(),
  summaryOverride: z.string().trim().max(1400).nullable().optional(),
  sectionOrder: z.array(z.enum(CV_LAB_SECTIONS)).optional(),
  hiddenSections: z.array(z.enum(CV_LAB_SECTIONS)).optional(),
});

const bodySchema = querySchema.extend({
  snapshot: cvLabSnapshotSchema.optional(),
});

const normalizeSectionOrder = (value: unknown) => {
  if (!Array.isArray(value)) {
    return [...CV_LAB_SECTIONS];
  }

  const sectionOrder = value
    .filter((section): section is string => typeof section === "string")
    .filter((section) =>
      CV_LAB_SECTIONS.includes(section as (typeof CV_LAB_SECTIONS)[number]),
    );

  const unique = Array.from(new Set(sectionOrder));
  const remaining = CV_LAB_SECTIONS.filter((section) => !unique.includes(section));

  return [...unique, ...remaining];
};

const normalizeHiddenSections = (value: unknown) => {
  if (!Array.isArray(value)) {
    return [] as (typeof CV_LAB_SECTIONS)[number][];
  }

  return Array.from(
    new Set(
      value
        .filter((section): section is string => typeof section === "string")
        .filter((section) =>
          CV_LAB_SECTIONS.includes(section as (typeof CV_LAB_SECTIONS)[number]),
        ),
    ),
  ) as (typeof CV_LAB_SECTIONS)[number][];
};

const pickOverride = <T,>(value: T | undefined, fallback: T) => {
  if (value !== undefined) {
    return value;
  }

  return fallback;
};

const getOwnedDocument = async (userId: string, documentId: string) => {
  const document = await prisma.cvLabDocument.findFirst({
    where: {
      id: documentId,
      userId,
    },
    include: {
      profile: true,
    },
  });

  if (!document) {
    throw new ZodRouteError("Document CV introuvable", 404);
  }

  return document;
};

const resolveProfileForSnapshot = async (params: {
  userId: string;
  profileId: string;
}) => {
  const profile = await prisma.userProfile.findFirst({
    where: {
      id: params.profileId,
      userId: params.userId,
    },
  });

  if (!profile) {
    throw new ZodRouteError("Profil introuvable", 404);
  }

  return profile;
};

const renderDocumentResponse = async (params: {
  mode: z.infer<typeof renderModeSchema>;
  download: boolean;
  document: Awaited<ReturnType<typeof getOwnedDocument>>;
}) => {
  const safeName = params.document.name
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .toLowerCase();
  const html = renderCvLabHtml(params.document, params.document.profile, {
    autoPrint: false,
  });

  if (params.mode === "pdf") {
    try {
      const pdf = await generateCvPdfBuffer(html);
      const pdfArrayBuffer = new ArrayBuffer(pdf.byteLength);
      new Uint8Array(pdfArrayBuffer).set(pdf);

      return new Response(pdfArrayBuffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Cache-Control": "private, max-age=0, must-revalidate",
          "Content-Disposition": `${params.download ? "attachment" : "inline"}; filename="${safeName || "cv"}.pdf"`,
        },
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Impossible de générer le PDF";
      throw new ZodRouteError(message, 503);
    }
  }

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, max-age=0, must-revalidate",
    },
  });
};

const buildDocumentFromSnapshot = async (params: {
  userId: string;
  document: Awaited<ReturnType<typeof getOwnedDocument>>;
  snapshot?: z.infer<typeof cvLabSnapshotSchema>;
}) => {
  const snapshot = params.snapshot;
  if (!snapshot) {
    return params.document;
  }

  const profile =
    snapshot.profileId && snapshot.profileId !== params.document.profileId
      ? await resolveProfileForSnapshot({
          userId: params.userId,
          profileId: snapshot.profileId,
        })
      : params.document.profile;

  const sectionOrder =
    snapshot.sectionOrder !== undefined
      ? normalizeSectionOrder(snapshot.sectionOrder)
      : normalizeSectionOrder(params.document.sectionOrder);
  const hiddenSections =
    snapshot.hiddenSections !== undefined
      ? normalizeHiddenSections(snapshot.hiddenSections)
      : normalizeHiddenSections(params.document.hiddenSections);

  return {
    ...params.document,
    profile,
    name: pickOverride(snapshot.name, params.document.name),
    targetRole: pickOverride(snapshot.targetRole, params.document.targetRole),
    template: pickOverride(snapshot.template, params.document.template),
    theme: pickOverride(snapshot.theme, params.document.theme),
    pageSize: "A4" as const,
    accentColor: pickOverride(snapshot.accentColor, params.document.accentColor),
    fontFamily: pickOverride(snapshot.fontFamily, params.document.fontFamily),
    headlineOverride: pickOverride(
      snapshot.headlineOverride,
      params.document.headlineOverride,
    ),
    summaryOverride: pickOverride(
      snapshot.summaryOverride,
      params.document.summaryOverride,
    ),
    sectionOrder,
    hiddenSections,
  };
};

export const GET = authRoute.query(querySchema).handler(async (_req, { query, ctx }) => {
  const document = await getOwnedDocument(ctx.user.id, query.documentId);
  return renderDocumentResponse({
    mode: query.mode,
    download: query.download,
    document,
  });
});

export const POST = authRoute.body(bodySchema).handler(async (_req, { body, ctx }) => {
  const document = await getOwnedDocument(ctx.user.id, body.documentId);
  const documentWithSnapshot = await buildDocumentFromSnapshot({
    userId: ctx.user.id,
    document,
    snapshot: body.snapshot,
  });

  return renderDocumentResponse({
    mode: body.mode,
    download: body.download,
    document: documentWithSnapshot,
  });
});
