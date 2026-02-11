import { createOpenAI } from "@ai-sdk/openai";
import { env } from "@/lib/env";

export const openai = createOpenAI({
  apiKey: env.OPENAI_API_KEY,
});

export const AI_MODELS = {
  fast: openai("gpt-4o-mini"),
  smart: openai("gpt-4o-mini"),
} as const;
