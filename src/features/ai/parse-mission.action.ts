"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { prisma } from "@/lib/prisma";
import { generateObject } from "ai";
import { z } from "zod";
import { AI_MODELS } from "./ai-config";
import { checkAndIncrementAIQuota } from "./ai-quota";
import {
  MISSION_PARSER_SYSTEM_PROMPT,
  missionParserOutputSchema,
} from "./prompts/mission-parser.prompt";
import { fetchUrlContent } from "./url-fetcher";

const parseMissionInputSchema = z.object({
  source: z.enum(["url", "text"]),
  content: z.string().min(1, "Le contenu ne peut pas être vide"),
});

export const parseMissionAction = authAction
  .inputSchema(parseMissionInputSchema)
  .action(async ({ parsedInput: { source, content }, ctx: { user } }) => {
    await checkAndIncrementAIQuota(user.id);

    let textContent = content;
    if (source === "url") {
      textContent = await fetchUrlContent(content);
    }

    const result = await generateObject({
      model: AI_MODELS.fast,
      system: MISSION_PARSER_SYSTEM_PROMPT,
      prompt: textContent,
      schema: missionParserOutputSchema,
    });

    await prisma.aIUsage.create({
      data: {
        userId: user.id,
        feature: "MISSION_PARSING",
        inputTokens: result.usage.inputTokens ?? 0,
        outputTokens: result.usage.outputTokens ?? 0,
      },
    });

    return result.object;
  });
