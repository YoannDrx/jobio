"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { generateObject } from "ai";
import { z } from "zod";
import { AI_MODELS } from "@/features/ai/ai-config";
import { runTrackedAI } from "@/features/ai/ai-usage";
import {
  LINKEDIN_PARSER_SYSTEM_PROMPT,
  linkedInParserOutputSchema,
} from "@/features/ai/prompts/linkedin-parser.prompt";

export const importLinkedInAction = authAction
  .inputSchema(
    z.object({
      content: z.string().min(10, "Le contenu est trop court"),
    }),
  )
  .action(async ({ parsedInput: { content }, ctx: { user } }) => {
    const result = await runTrackedAI(
      {
        userId: user.id,
        feature: "PROFILE_IMPORT",
        modelId: AI_MODELS.fast.modelId,
        context: { source: "linkedin-text" },
      },
      async () =>
        generateObject({
          model: AI_MODELS.fast,
          system: LINKEDIN_PARSER_SYSTEM_PROMPT,
          prompt: content,
          schema: linkedInParserOutputSchema,
        }),
    );

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
