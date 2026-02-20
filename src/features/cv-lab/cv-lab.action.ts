"use server";

import { Prisma } from "@/generated/prisma";
import { authAction } from "@/lib/actions/safe-actions";
import { ApplicationError } from "@/lib/errors/application-error";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import {
  createCvLabDocumentSchema,
  createCvLabVersionSchema,
  cvLabDocumentIdSchema,
  CV_LAB_SECTIONS,
  restoreCvLabVersionSchema,
  updateCvLabDocumentSchema,
} from "./cv-lab.schema";
import { analyzeCvAts } from "./cv-ats";
import {
  resolveCvContent,
  resolveCvContentFromProfile,
} from "./cv-content-resolver";

type CvLabDocumentForSnapshot = {
  id: string;
  profileId: string;
  name: string;
  targetRole: string | null;
  template: string;
  theme: string;
  pageSize: string;
  accentColor: string;
  fontFamily: string;
  headlineOverride: string | null;
  summaryOverride: string | null;
  sectionOrder: Prisma.JsonValue;
  hiddenSections: Prisma.JsonValue;
  masterCvId?: string | null;
  contentOverrides?: Prisma.JsonValue;
  hiddenItems?: Prisma.JsonValue;
  personalInfo?: Prisma.JsonValue;
};

type CvLabProfileForSnapshot = {
  bio: string | null;
  experiences: Prisma.JsonValue | null;
};

const ensureOwnedProfile = async (userId: string, profileId: string) => {
  const profile = await prisma.userProfile.findFirst({
    where: {
      id: profileId,
      userId,
    },
    select: {
      id: true,
      name: true,
      bio: true,
      experiences: true,
    },
  });

  if (!profile) {
    throw new ApplicationError("Profil introuvable");
  }

  return profile;
};

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
  const remaining = CV_LAB_SECTIONS.filter(
    (section) => !unique.includes(section),
  );
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

const toJsonArray = (value: string[]): Prisma.InputJsonValue =>
  value as unknown as Prisma.InputJsonValue;

const buildExperienceLines = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== "object") return "";
      const data = item as Record<string, unknown>;
      const title = typeof data.title === "string" ? data.title.trim() : "";
      const company =
        typeof data.company === "string" ? data.company.trim() : "";
      const description =
        typeof data.description === "string" ? data.description.trim() : "";

      const headline = [title, company].filter(Boolean).join(" · ");
      if (headline && description) {
        return `${headline} — ${description}`;
      }

      return headline || description;
    })
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .slice(0, 80);
};

const buildVersionSnapshot = (
  document: CvLabDocumentForSnapshot,
  profile?: CvLabProfileForSnapshot | null,
) => ({
  profileId: document.profileId,
  name: document.name,
  targetRole: document.targetRole,
  template: document.template,
  theme: document.theme,
  pageSize: "A4",
  accentColor: document.accentColor,
  fontFamily: document.fontFamily,
  headlineOverride: document.headlineOverride,
  summaryOverride: document.summaryOverride,
  sectionOrder: normalizeSectionOrder(document.sectionOrder),
  hiddenSections: normalizeHiddenSections(document.hiddenSections),
  masterCvId: document.masterCvId ?? null,
  contentOverrides: document.contentOverrides ?? null,
  hiddenItems: document.hiddenItems ?? null,
  personalInfo: document.personalInfo ?? null,
  ...(profile
    ? {
        profileSnapshot: {
          summaryText: document.summaryOverride ?? profile.bio,
          experienceLines: buildExperienceLines(profile.experiences),
        },
      }
    : {}),
});

export const listCvLabDocumentsAction = authAction
  .inputSchema(z.object({ includeArchived: z.boolean().optional() }))
  .action(async ({ parsedInput, ctx: { user } }) => {
    const documents = await prisma.cvLabDocument.findMany({
      where: {
        userId: user.id,
        ...(parsedInput.includeArchived ? {} : { archivedAt: null }),
      },
      include: {
        profile: {
          select: {
            id: true,
            name: true,
            headline: true,
            updatedAt: true,
          },
        },
        _count: {
          select: {
            versions: true,
          },
        },
      },
      orderBy: [{ archivedAt: "asc" }, { updatedAt: "desc" }],
    });

    return documents.map((document) => ({
      ...document,
      sectionOrder: normalizeSectionOrder(document.sectionOrder),
      hiddenSections: normalizeHiddenSections(document.hiddenSections),
    }));
  });

export const getCvLabDocumentAction = authAction
  .inputSchema(cvLabDocumentIdSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    const document = await prisma.cvLabDocument.findFirst({
      where: {
        id: parsedInput.id,
        userId: user.id,
      },
      include: {
        profile: true,
        masterCv: true,
      },
    });

    if (!document) {
      throw new ApplicationError("Document CV introuvable");
    }

    return {
      ...document,
      sectionOrder: normalizeSectionOrder(document.sectionOrder),
      hiddenSections: normalizeHiddenSections(document.hiddenSections),
    };
  });

export const createCvLabDocumentAction = authAction
  .inputSchema(createCvLabDocumentSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    const ownedProfile = await ensureOwnedProfile(
      user.id,
      parsedInput.profileId,
    );

    const createdDocument = await prisma.cvLabDocument.create({
      data: {
        userId: user.id,
        profileId: parsedInput.profileId,
        name: parsedInput.name,
        targetRole: parsedInput.targetRole ?? null,
        template: parsedInput.template,
        theme: parsedInput.theme,
        pageSize: "A4",
        accentColor: parsedInput.accentColor,
        fontFamily: parsedInput.fontFamily,
        headlineOverride: parsedInput.headlineOverride ?? null,
        summaryOverride: parsedInput.summaryOverride ?? null,
        sectionOrder: toJsonArray(parsedInput.sectionOrder),
        hiddenSections: toJsonArray(parsedInput.hiddenSections),
        masterCvId: parsedInput.masterCvId ?? null,
        contentOverrides: parsedInput.contentOverrides
          ? (parsedInput.contentOverrides as unknown as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        hiddenItems: parsedInput.hiddenItems
          ? (parsedInput.hiddenItems as unknown as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        personalInfo: parsedInput.personalInfo
          ? (parsedInput.personalInfo as unknown as Prisma.InputJsonValue)
          : Prisma.JsonNull,
      },
    });

    await prisma.cvLabDocumentVersion.create({
      data: {
        documentId: createdDocument.id,
        userId: user.id,
        label: "Version initiale",
        snapshot: buildVersionSnapshot(createdDocument, ownedProfile),
      },
    });

    return createdDocument;
  });

export const updateCvLabDocumentAction = authAction
  .inputSchema(updateCvLabDocumentSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    const current = await prisma.cvLabDocument.findFirst({
      where: {
        id: parsedInput.id,
        userId: user.id,
      },
    });

    if (!current) {
      throw new ApplicationError("Document CV introuvable");
    }

    if (parsedInput.profileId) {
      await ensureOwnedProfile(user.id, parsedInput.profileId);
    }

    const updated = await prisma.cvLabDocument.update({
      where: {
        id: parsedInput.id,
      },
      data: {
        profileId: parsedInput.profileId,
        name: parsedInput.name,
        targetRole: parsedInput.targetRole ?? undefined,
        template: parsedInput.template,
        theme: parsedInput.theme,
        pageSize: "A4",
        accentColor: parsedInput.accentColor,
        fontFamily: parsedInput.fontFamily,
        headlineOverride:
          parsedInput.headlineOverride !== undefined
            ? parsedInput.headlineOverride
            : undefined,
        summaryOverride:
          parsedInput.summaryOverride !== undefined
            ? parsedInput.summaryOverride
            : undefined,
        sectionOrder:
          parsedInput.sectionOrder !== undefined
            ? toJsonArray(parsedInput.sectionOrder)
            : undefined,
        hiddenSections:
          parsedInput.hiddenSections !== undefined
            ? toJsonArray(parsedInput.hiddenSections)
            : undefined,
        masterCvId:
          parsedInput.masterCvId !== undefined
            ? parsedInput.masterCvId
            : undefined,
        contentOverrides:
          parsedInput.contentOverrides !== undefined
            ? parsedInput.contentOverrides
              ? (parsedInput.contentOverrides as unknown as Prisma.InputJsonValue)
              : Prisma.JsonNull
            : undefined,
        hiddenItems:
          parsedInput.hiddenItems !== undefined
            ? parsedInput.hiddenItems
              ? (parsedInput.hiddenItems as unknown as Prisma.InputJsonValue)
              : Prisma.JsonNull
            : undefined,
        personalInfo:
          parsedInput.personalInfo !== undefined
            ? parsedInput.personalInfo
              ? (parsedInput.personalInfo as unknown as Prisma.InputJsonValue)
              : Prisma.JsonNull
            : undefined,
      },
    });

    return updated;
  });

export const duplicateCvLabDocumentAction = authAction
  .inputSchema(
    cvLabDocumentIdSchema.extend({
      name: z.string().trim().min(2).max(80).optional(),
    }),
  )
  .action(async ({ parsedInput, ctx: { user } }) => {
    const source = await prisma.cvLabDocument.findFirst({
      where: {
        id: parsedInput.id,
        userId: user.id,
      },
      include: {
        profile: {
          select: {
            bio: true,
            experiences: true,
          },
        },
      },
    });

    if (!source) {
      throw new ApplicationError("Document CV introuvable");
    }

    const copy = await prisma.cvLabDocument.create({
      data: {
        userId: user.id,
        profileId: source.profileId,
        name: parsedInput.name ?? `${source.name} (copie)`,
        targetRole: source.targetRole,
        template: source.template,
        theme: source.theme,
        pageSize: "A4",
        accentColor: source.accentColor,
        fontFamily: source.fontFamily,
        headlineOverride: source.headlineOverride,
        summaryOverride: source.summaryOverride,
        sectionOrder: source.sectionOrder ?? Prisma.JsonNull,
        hiddenSections: source.hiddenSections ?? Prisma.JsonNull,
      },
    });

    await prisma.cvLabDocumentVersion.create({
      data: {
        documentId: copy.id,
        userId: user.id,
        label: "Copie initiale",
        snapshot: buildVersionSnapshot(copy, source.profile),
      },
    });

    return copy;
  });

export const archiveCvLabDocumentAction = authAction
  .inputSchema(cvLabDocumentIdSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    const document = await prisma.cvLabDocument.findFirst({
      where: {
        id: parsedInput.id,
        userId: user.id,
      },
      select: {
        id: true,
      },
    });

    if (!document) {
      throw new ApplicationError("Document CV introuvable");
    }

    await prisma.cvLabDocument.update({
      where: {
        id: document.id,
      },
      data: {
        archivedAt: new Date(),
      },
    });

    return {
      success: true,
    };
  });

export const restoreCvLabDocumentAction = authAction
  .inputSchema(cvLabDocumentIdSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    const document = await prisma.cvLabDocument.findFirst({
      where: {
        id: parsedInput.id,
        userId: user.id,
      },
      select: {
        id: true,
      },
    });

    if (!document) {
      throw new ApplicationError("Document CV introuvable");
    }

    await prisma.cvLabDocument.update({
      where: {
        id: document.id,
      },
      data: {
        archivedAt: null,
      },
    });

    return {
      success: true,
    };
  });

export const deleteCvLabDocumentAction = authAction
  .inputSchema(cvLabDocumentIdSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    const document = await prisma.cvLabDocument.findFirst({
      where: {
        id: parsedInput.id,
        userId: user.id,
      },
      select: {
        id: true,
      },
    });

    if (!document) {
      throw new ApplicationError("Document CV introuvable");
    }

    await prisma.cvLabDocument.delete({
      where: {
        id: document.id,
      },
    });

    return {
      success: true,
    };
  });

export const createCvLabVersionAction = authAction
  .inputSchema(createCvLabVersionSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    const document = await prisma.cvLabDocument.findFirst({
      where: {
        id: parsedInput.documentId,
        userId: user.id,
      },
      include: {
        profile: {
          select: {
            bio: true,
            experiences: true,
          },
        },
      },
    });

    if (!document) {
      throw new ApplicationError("Document CV introuvable");
    }

    const version = await prisma.cvLabDocumentVersion.create({
      data: {
        documentId: document.id,
        userId: user.id,
        label:
          parsedInput.label ??
          `Snapshot ${new Intl.DateTimeFormat("fr-FR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }).format(new Date())}`,
        snapshot: buildVersionSnapshot(document, document.profile),
      },
    });

    return version;
  });

export const listCvLabVersionsAction = authAction
  .inputSchema(
    z.object({
      documentId: z.string().min(1),
      limit: z.number().min(1).max(50).default(15),
    }),
  )
  .action(async ({ parsedInput, ctx: { user } }) => {
    const document = await prisma.cvLabDocument.findFirst({
      where: {
        id: parsedInput.documentId,
        userId: user.id,
      },
      select: {
        id: true,
      },
    });

    if (!document) {
      throw new ApplicationError("Document CV introuvable");
    }

    return prisma.cvLabDocumentVersion.findMany({
      where: {
        documentId: document.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: parsedInput.limit,
    });
  });

export const restoreCvLabVersionAction = authAction
  .inputSchema(restoreCvLabVersionSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    const version = await prisma.cvLabDocumentVersion.findFirst({
      where: {
        id: parsedInput.versionId,
        documentId: parsedInput.documentId,
        userId: user.id,
      },
      select: {
        id: true,
        snapshot: true,
      },
    });

    if (!version) {
      throw new ApplicationError("Version introuvable");
    }

    const snapshot = z
      .object({
        profileId: z.string(),
        name: z.string(),
        targetRole: z.string().nullable().optional(),
        template: z.enum(["CLASSIC", "TWO_COLUMN", "EXECUTIVE", "COMPACT"]),
        theme: z.enum(["MINIMAL", "MODERN", "CONTRAST", "BOLD"]),
        pageSize: z.enum(["A4", "LETTER"]),
        accentColor: z.string(),
        fontFamily: z.string(),
        headlineOverride: z.string().nullable().optional(),
        summaryOverride: z.string().nullable().optional(),
        sectionOrder: z.array(z.enum(CV_LAB_SECTIONS)),
        hiddenSections: z.array(z.enum(CV_LAB_SECTIONS)),
      })
      .parse(version.snapshot);

    await ensureOwnedProfile(user.id, snapshot.profileId);

    await prisma.cvLabDocument.update({
      where: {
        id: parsedInput.documentId,
      },
      data: {
        profileId: snapshot.profileId,
        name: snapshot.name,
        targetRole: snapshot.targetRole ?? null,
        template: snapshot.template,
        theme: snapshot.theme,
        pageSize: "A4",
        accentColor: snapshot.accentColor,
        fontFamily: snapshot.fontFamily,
        headlineOverride: snapshot.headlineOverride ?? null,
        summaryOverride: snapshot.summaryOverride ?? null,
        sectionOrder: toJsonArray(snapshot.sectionOrder),
        hiddenSections: toJsonArray(snapshot.hiddenSections),
      },
    });

    return {
      success: true,
    };
  });

export const analyzeCvLabAtsAction = authAction
  .inputSchema(
    z.object({
      documentId: z.string().min(1),
      jobDescription: z.string().trim().max(6000).optional().nullable(),
      snapshot: z
        .object({
          profileId: z.string().min(1),
          targetRole: z.string().trim().max(120).optional().nullable(),
          headlineOverride: z.string().trim().max(180).optional().nullable(),
          summaryOverride: z.string().trim().max(1400).optional().nullable(),
          sectionOrder: z.array(z.enum(CV_LAB_SECTIONS)).optional(),
          hiddenSections: z.array(z.enum(CV_LAB_SECTIONS)).optional(),
        })
        .optional(),
    }),
  )
  .action(async ({ parsedInput, ctx: { user } }) => {
    const document = await prisma.cvLabDocument.findFirst({
      where: {
        id: parsedInput.documentId,
        userId: user.id,
      },
      include: {
        profile: true,
        masterCv: true,
      },
    });

    if (!document) {
      throw new ApplicationError("Document CV introuvable");
    }

    const documentOverrides = {
      contentOverrides: document.contentOverrides,
      hiddenItems: document.hiddenItems,
      personalInfo: document.personalInfo,
    };

    const content = document.masterCv
      ? resolveCvContent(document.masterCv, documentOverrides)
      : resolveCvContentFromProfile(document.profile, documentOverrides);

    const normalizedSectionOrder = parsedInput.snapshot?.sectionOrder
      ? normalizeSectionOrder(parsedInput.snapshot.sectionOrder)
      : normalizeSectionOrder(document.sectionOrder);
    const normalizedHiddenSections = parsedInput.snapshot?.hiddenSections
      ? normalizeHiddenSections(parsedInput.snapshot.hiddenSections)
      : normalizeHiddenSections(document.hiddenSections);

    return analyzeCvAts({
      content,
      document: {
        ...document,
        targetRole: parsedInput.snapshot?.targetRole ?? document.targetRole,
        headlineOverride:
          parsedInput.snapshot?.headlineOverride ?? document.headlineOverride,
        summaryOverride:
          parsedInput.snapshot?.summaryOverride ?? document.summaryOverride,
        sectionOrder: normalizedSectionOrder,
        hiddenSections: normalizedHiddenSections,
      },
      jobDescription: parsedInput.jobDescription ?? null,
    });
  });
