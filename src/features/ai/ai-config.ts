import { createOpenAI } from "@ai-sdk/openai";

export const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const AI_MODELS = {
  fast: openai("gpt-4o-mini"),
  smart: openai("gpt-4o-mini"),
} as const;
