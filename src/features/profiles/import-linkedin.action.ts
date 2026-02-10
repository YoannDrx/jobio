"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { prisma } from "@/lib/prisma";
import { generateObject } from "ai";
import { z } from "zod";
import { AI_MODELS } from "@/features/ai/ai-config";
import { checkAndIncrementAIQuota } from "@/features/ai/ai-quota";
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
    await checkAndIncrementAIQuota(user.id);

    const result = await generateObject({
      model: AI_MODELS.fast,
      system: LINKEDIN_PARSER_SYSTEM_PROMPT,
      prompt: content,
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

    return {
      headline: result.object.headline,
      bio: result.object.bio ?? undefined,
      skills: result.object.skills,
    };
  });
