"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { generateObject } from "ai";
import { z } from "zod";
import { AI_MODELS } from "./ai-config";
import { runTrackedAI } from "./ai-usage";
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
    let textContent = content;
    if (source === "url") {
      textContent = await fetchUrlContent(content);
    }

    const result = await runTrackedAI(
      {
        userId: user.id,
        feature: "MISSION_PARSING",
        modelId: AI_MODELS.fast.modelId,
        context: { source },
      },
      async () =>
        generateObject({
          model: AI_MODELS.fast,
          system: MISSION_PARSER_SYSTEM_PROMPT,
          prompt: textContent,
          schema: missionParserOutputSchema,
        }),
    );

    return result.object;
  });
