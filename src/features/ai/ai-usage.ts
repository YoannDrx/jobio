import type { AIFeature, Prisma } from "@/generated/prisma";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { estimateAIUsageCostMicros } from "./ai-cost";
import { checkAndIncrementAIQuota } from "./ai-quota";

type TokenUsage = {
  inputTokens: number | undefined;
  outputTokens: number | undefined;
};

type ProviderResponse = {
  id?: string;
  modelId?: string;
};

type TrackableAIResult = {
  usage: TokenUsage;
  response?: ProviderResponse;
};

type AIUsageTrackerInput = {
  userId: string;
  feature: AIFeature;
  modelId: string;
  context?: Prisma.InputJsonObject;
};

const normalizeAIErrorCode = (error: unknown): string => {
  if (error && typeof error === "object") {
    const candidate = error as { name?: unknown; statusCode?: unknown };
    if (typeof candidate.statusCode === "number") {
      return `HTTP_${candidate.statusCode}`;
    }
    if (typeof candidate.name === "string" && candidate.name.trim()) {
      return candidate.name.replace(/[^A-Za-z0-9_-]/g, "_").slice(0, 100);
    }
  }
  return "UNKNOWN_AI_ERROR";
};

export const createAIUsageTracker = async (input: AIUsageTrackerInput) => {
  const startedAt = Date.now();
  const reservation = await checkAndIncrementAIQuota(input.userId);
  let usageId: string;

  try {
    const usage = await prisma.aIUsage.create({
      data: {
        userId: input.userId,
        feature: input.feature,
        inputTokens: 0,
        outputTokens: 0,
        modelId: input.modelId,
        status: "RUNNING",
        context: input.context,
      },
      select: { id: true },
    });
    usageId = usage.id;
  } catch (error) {
    await reservation.release();
    throw error;
  }

  let settled = false;

  return {
    succeed: async (
      tokenUsage: TokenUsage,
      response?: ProviderResponse,
    ): Promise<void> => {
      if (settled) return;
      settled = true;
      const resolvedModelId = response?.modelId ?? input.modelId;
      try {
        await prisma.aIUsage.update({
          where: { id: usageId },
          data: {
            inputTokens: tokenUsage.inputTokens ?? 0,
            outputTokens: tokenUsage.outputTokens ?? 0,
            modelId: resolvedModelId,
            estimatedCostMicros: estimateAIUsageCostMicros(
              resolvedModelId,
              tokenUsage,
            ),
            latencyMs: Date.now() - startedAt,
            status: "SUCCEEDED",
            requestId: response?.id,
          },
        });
      } catch (error) {
        // The RUNNING row remains visible to operations for reconciliation and
        // the quota stays consumed because the provider call did succeed.
        logger.error("AI usage completion could not be persisted", {
          usageId,
          feature: input.feature,
          error,
        });
        throw error;
      }
    },
    fail: async (error: unknown): Promise<void> => {
      if (settled) return;
      settled = true;
      await reservation.release();
      try {
        await prisma.aIUsage.update({
          where: { id: usageId },
          data: {
            latencyMs: Date.now() - startedAt,
            status: "FAILED",
            errorCode: normalizeAIErrorCode(error),
          },
        });
      } catch (persistenceError) {
        logger.error("AI usage failure could not be persisted", {
          usageId,
          feature: input.feature,
          error: persistenceError,
        });
      }
    },
  };
};

export const runTrackedAI = async <T extends TrackableAIResult>(
  input: AIUsageTrackerInput,
  operation: () => Promise<T>,
): Promise<T> => {
  const tracker = await createAIUsageTracker(input);
  try {
    const result = await operation();
    await tracker.succeed(result.usage, result.response);
    return result;
  } catch (error) {
    await tracker.fail(error);
    throw error;
  }
};
