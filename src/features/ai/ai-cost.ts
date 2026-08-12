type TokenUsage = {
  inputTokens: number | undefined;
  outputTokens: number | undefined;
};

// Prices are deliberately estimates, expressed in USD per million tokens.
// Unknown models stay measurable (tokens/model/latency) without inventing a cost.
const MODEL_PRICING_USD_PER_MILLION: Partial<
  Record<string, { input: number; output: number }>
> = {
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  "gpt-4o": { input: 2.5, output: 10 },
};

export const estimateAIUsageCostMicros = (
  modelId: string,
  usage: TokenUsage,
): number | null => {
  const pricing = MODEL_PRICING_USD_PER_MILLION[modelId];
  if (!pricing) return null;
  return Math.round(
    (usage.inputTokens ?? 0) * pricing.input +
      (usage.outputTokens ?? 0) * pricing.output,
  );
};
