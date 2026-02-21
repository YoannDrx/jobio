import { authRoute } from "@/lib/zod-route";
import { checkAndIncrementAIQuota } from "@/features/ai/ai-quota";
import { AI_MODELS } from "@/features/ai/ai-config";
import {
  MISSION_PARSER_SYSTEM_PROMPT,
  missionParserOutputSchema,
} from "@/features/ai/prompts/mission-parser.prompt";
import { fetchUrlContent } from "@/features/ai/url-fetcher";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit } from "@/lib/security/rate-limit";
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
    const rateLimit = await enforceRateLimit({
      key: `mission-capture:${ctx.user.id}`,
      limit: 20,
      windowSeconds: 60,
    });

    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({
          error: "Trop de captures envoyées. Réessaie dans quelques secondes.",
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(rateLimit.retryAfterSeconds),
          },
        },
      );
    }

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
