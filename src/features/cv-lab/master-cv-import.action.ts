"use server";

import { generateObject } from "ai";
import type { Prisma } from "@/generated/prisma";
import { authAction } from "@/lib/actions/safe-actions";
import { ActionError } from "@/lib/errors/action-error";
import { ApplicationError } from "@/lib/errors/application-error";
import { prisma } from "@/lib/prisma";
import { checkAndIncrementAIQuota } from "@/features/ai/ai-quota";
import { AI_MODELS } from "@/features/ai/ai-config";
import { extractTextFromPDF } from "@/features/profiles/pdf-parser";
import { nanoid } from "nanoid";
import { z } from "zod";
import { extractTextFromDocx } from "./cv-coach-docx-parser";

const masterCvExtractSchema = z.object({
  fullName: z.string().default(""),
  headline: z.string().default(""),
  summary: z.string().default(""),
  email: z.string().default(""),
  phone: z.string().default(""),
  city: z.string().default(""),
  experiences: z
    .array(
      z.object({
        title: z.string(),
        company: z.string(),
        startDate: z.string().default(""),
        endDate: z.string().default(""),
        description: z.string().default(""),
        current: z.boolean().default(false),
      }),
    )
    .default([]),
  skills: z
    .array(
      z.object({
        name: z.string(),
        level: z.string().default(""),
      }),
    )
    .default([]),
  education: z
    .array(
      z.object({
        institution: z.string(),
        degree: z.string(),
        field: z.string().default(""),
        startDate: z.string().default(""),
        endDate: z.string().default(""),
        description: z.string().default(""),
      }),
    )
    .default([]),
  projects: z
    .array(
      z.object({
        name: z.string(),
        description: z.string().default(""),
        url: z.string().default(""),
        technologies: z.array(z.string()).default([]),
      }),
    )
    .default([]),
  languages: z
    .array(
      z.object({
        name: z.string(),
        level: z.string().default(""),
      }),
    )
    .default([]),
  certifications: z
    .array(
      z.object({
        name: z.string(),
        issuer: z.string().default(""),
        date: z.string().default(""),
        url: z.string().default(""),
      }),
    )
    .default([]),
  hobbies: z.array(z.string()).default([]),
  driverLicenses: z.array(z.string()).default([]),
});

const IMPORT_SYSTEM_PROMPT = `Tu es un expert en extraction de donnees CV. A partir du texte brut d'un CV (PDF ou DOCX), extrais toutes les informations structurees.

Regles:
- Extrais TOUTES les informations disponibles, meme partielles.
- Pour les dates, utilise le format "MM/YYYY" ou "YYYY" si le mois n'est pas disponible.
- Pour les experiences en cours, mets current: true et endDate vide.
- Pour les competences, estime le niveau: "BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT".
- Pour les langues, estime le niveau: "BEGINNER", "INTERMEDIATE", "ADVANCED", "FLUENT".
- Si une information n'est pas disponible, utilise une chaine vide.
- N'invente aucune information. Extrais uniquement ce qui est present dans le texte.
- Regroupe les competences techniques (langages, frameworks, outils) dans skills.
- Extrais les loisirs/hobbies et permis de conduire s'ils sont mentionnes.

Retourne uniquement l'objet JSON valide selon le schema fourni.`;

const addIdsToItems = <T extends Record<string, unknown>>(
  items: T[],
): (T & { id: string })[] => items.map((item) => ({ ...item, id: nanoid(11) }));

const toJson = (val: unknown): Prisma.InputJsonValue =>
  val as Prisma.InputJsonValue;

export const importMasterCvFromFileAction = authAction
  .inputSchema(
    z.object({
      formData: z.instanceof(FormData),
    }),
  )
  .action(async ({ parsedInput: { formData }, ctx: { user } }) => {
    const file = formData.get("file") as File;

    if (!(file instanceof File)) {
      throw new ActionError("Aucun fichier fourni");
    }

    const mimeType = file.type;
    const fileExtension = file.name.split(".").pop()?.toLowerCase();

    const isPdf = mimeType === "application/pdf" || fileExtension === "pdf";
    const isDocx =
      mimeType ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      fileExtension === "docx";

    if (!isPdf && !isDocx) {
      throw new ActionError("Seuls les fichiers PDF et DOCX sont acceptes");
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new ActionError("Le fichier est trop volumineux (max 5 Mo)");
    }

    await checkAndIncrementAIQuota(user.id);

    const buffer = await file.arrayBuffer();

    const extractedText = isPdf
      ? await extractTextFromPDF(buffer)
      : await extractTextFromDocx(buffer);

    const response = await generateObject({
      model: AI_MODELS.smart,
      system: IMPORT_SYSTEM_PROMPT,
      prompt: extractedText,
      schema: masterCvExtractSchema,
      temperature: 0.1,
    });

    const extracted = response.object;

    const experiences = addIdsToItems(extracted.experiences);
    const skills = addIdsToItems(extracted.skills);
    const education = addIdsToItems(extracted.education);
    const projects = addIdsToItems(extracted.projects);
    const languages = addIdsToItems(extracted.languages);
    const certifications = addIdsToItems(extracted.certifications);

    const existing = await prisma.masterCv.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });

    const sectionData = {
      headline: extracted.headline || undefined,
      summary: extracted.summary || undefined,
      email: extracted.email || undefined,
      phone: extracted.phone || undefined,
      city: extracted.city || undefined,
      hobbies:
        extracted.hobbies.length > 0 ? toJson(extracted.hobbies) : undefined,
      driverLicenses:
        extracted.driverLicenses.length > 0
          ? toJson(extracted.driverLicenses)
          : undefined,
      experiences: experiences.length > 0 ? toJson(experiences) : undefined,
      skills: skills.length > 0 ? toJson(skills) : undefined,
      education: education.length > 0 ? toJson(education) : undefined,
      projects: projects.length > 0 ? toJson(projects) : undefined,
      languages: languages.length > 0 ? toJson(languages) : undefined,
      certifications:
        certifications.length > 0 ? toJson(certifications) : undefined,
    };

    const fullName = extracted.fullName || user.name || "Mon CV";

    if (existing) {
      return prisma.masterCv.update({
        where: { userId: user.id },
        data: { fullName, ...sectionData },
      });
    }

    return prisma.masterCv.create({
      data: {
        userId: user.id,
        fullName,
        ...sectionData,
      },
    });
  });

export const importMasterCvFromCoachSessionAction = authAction
  .inputSchema(z.object({ sessionId: z.string().min(1) }))
  .action(async ({ parsedInput, ctx: { user } }) => {
    const session = await prisma.cvLabCoachSession.findFirst({
      where: { id: parsedInput.sessionId, userId: user.id },
      select: { structuredSnapshot: true },
    });

    if (!session) {
      throw new ApplicationError("Session CV Coach introuvable");
    }

    if (
      !session.structuredSnapshot ||
      typeof session.structuredSnapshot !== "object"
    ) {
      throw new ApplicationError("Aucune donnee structuree dans cette session");
    }

    const snapshot = session.structuredSnapshot as Record<string, unknown>;
    const identity = (snapshot.identity ?? {}) as Record<string, unknown>;

    const asString = (val: unknown): string =>
      typeof val === "string" ? val.trim() : "";

    const mapWithIds = (items: unknown): Record<string, unknown>[] => {
      if (!Array.isArray(items)) return [];
      return items.map((item) => ({
        ...(typeof item === "object" && item !== null ? item : {}),
        id: nanoid(11),
      }));
    };

    const skillsRaw = snapshot.skills as Record<string, unknown> | undefined;
    const hardSkills = Array.isArray(skillsRaw?.hard)
      ? (skillsRaw.hard as string[])
      : [];
    const toolSkills = Array.isArray(skillsRaw?.tools)
      ? (skillsRaw.tools as string[])
      : [];
    const mergedSkills = [...new Set([...hardSkills, ...toolSkills])]
      .filter((s) => s.trim().length > 0)
      .map((name) => ({ id: nanoid(11), name, level: "ADVANCED" }));

    const experiences = mapWithIds(snapshot.experiences);
    const education = mapWithIds(snapshot.education);
    const projects = mapWithIds(snapshot.projects);
    const languages = mapWithIds(snapshot.languages);
    const certifications = mapWithIds(snapshot.certifications);
    const interests = Array.isArray(snapshot.interests)
      ? (snapshot.interests as string[]).filter(
          (s) => typeof s === "string" && s.trim().length > 0,
        )
      : [];

    const existing = await prisma.masterCv.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });

    const data = {
      fullName: asString(identity.fullName) || user.name || "Mon CV",
      headline:
        asString(identity.headline) || asString(identity.targetRole) || null,
      summary: asString(snapshot.summary) || null,
      email: asString(identity.email) || null,
      phone: asString(identity.phone) || null,
      city: asString(identity.location) || null,
      hobbies: interests.length > 0 ? toJson(interests) : undefined,
      experiences: experiences.length > 0 ? toJson(experiences) : undefined,
      skills: mergedSkills.length > 0 ? toJson(mergedSkills) : undefined,
      education: education.length > 0 ? toJson(education) : undefined,
      projects: projects.length > 0 ? toJson(projects) : undefined,
      languages: languages.length > 0 ? toJson(languages) : undefined,
      certifications:
        certifications.length > 0 ? toJson(certifications) : undefined,
    };

    if (existing) {
      return prisma.masterCv.update({
        where: { userId: user.id },
        data,
      });
    }

    return prisma.masterCv.create({
      data: {
        userId: user.id,
        ...data,
      },
    });
  });
