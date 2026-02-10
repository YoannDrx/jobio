import { authRoute } from "@/lib/zod-route";
import { checkAndIncrementAIQuota } from "@/features/ai/ai-quota";
import { AI_MODELS } from "@/features/ai/ai-config";
import {
  MISSION_PARSER_SYSTEM_PROMPT,
  missionParserOutputSchema,
} from "@/features/ai/prompts/mission-parser.prompt";
import { fetchUrlContent } from "@/features/ai/url-fetcher";
import { prisma } from "@/lib/prisma";
import { generateObject } from "ai";
import { z } from "zod";

export const POST = authRoute
  .body(
    z.object({
      source: z.enum(["url", "text"]),
      content: z.string().min(1),
    }),
  )
  .handler(async (_req, { body, ctx }) => {
    await checkAndIncrementAIQuota(ctx.user.id);

    let textContent = body.content;
    if (body.source === "url") {
      textContent = await fetchUrlContent(body.content);
    }

    const result = await generateObject({
      model: AI_MODELS.fast,
      system: MISSION_PARSER_SYSTEM_PROMPT,
      prompt: textContent,
      schema: missionParserOutputSchema,
    });

    await prisma.aIUsage.create({
      data: {
        userId: ctx.user.id,
        feature: "MISSION_PARSING",
        inputTokens: result.usage.inputTokens ?? 0,
        outputTokens: result.usage.outputTokens ?? 0,
      },
    });

    return result.object;
  });
