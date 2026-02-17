"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { ActionError } from "@/lib/errors/action-error";
import { prisma } from "@/lib/prisma";
import { generateObject } from "ai";
import { z } from "zod";
import { AI_MODELS } from "@/features/ai/ai-config";
import { checkAndIncrementAIQuota } from "@/features/ai/ai-quota";
import {
  LINKEDIN_PARSER_SYSTEM_PROMPT,
  linkedInParserOutputSchema,
} from "@/features/ai/prompts/linkedin-parser.prompt";
import { extractTextFromPDF } from "./pdf-parser";

export const importLinkedInPdfAction = authAction
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

    if (file.type !== "application/pdf") {
      throw new ActionError("Seuls les fichiers PDF sont acceptés");
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new ActionError("Le fichier est trop volumineux (max 5 Mo)");
    }

    await checkAndIncrementAIQuota(user.id);

    const buffer = await file.arrayBuffer();
    const text = await extractTextFromPDF(buffer);

    const result = await generateObject({
      model: AI_MODELS.fast,
      system: LINKEDIN_PARSER_SYSTEM_PROMPT,
      prompt: text,
      schema: linkedInParserOutputSchema,
    });

    await prisma.aIUsage.create({
      data: {
        userId: user.id,
        feature: "PROFILE_IMPORT",
        inputTokens: result.usage.inputTokens ?? 0,
        outputTokens: result.usage.outputTokens ?? 0,
      },
    });

    type StripNulls<T> = {
      [K in keyof T]: Exclude<T[K], null>;
    };
    const stripNulls = <T extends Record<string, unknown>>(
      obj: T,
    ): StripNulls<T> =>
      Object.fromEntries(
        Object.entries(obj).map(([k, v]) => [k, v === null ? undefined : v]),
      ) as StripNulls<T>;

    return {
      headline: result.object.headline,
      bio: result.object.bio ?? undefined,
      skills: result.object.skills,
      experiences: result.object.experiences.map(stripNulls),
      education: result.object.education.map(stripNulls),
      certifications: result.object.certifications.map(stripNulls),
      languages: result.object.languages,
      projects: result.object.projects.map(stripNulls),
    };
  });
