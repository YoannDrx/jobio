import { estimateAIUsageCostMicros } from "@/features/ai/ai-cost";
import { runTrackedAI } from "@/features/ai/ai-usage";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  release: vi.fn(),
  quota: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
}));

vi.mock("@/features/ai/ai-quota", () => ({
  checkAndIncrementAIQuota: mocks.quota,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    aIUsage: {
      create: mocks.create,
      update: mocks.update,
    },
  },
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn() },
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.quota.mockResolvedValue({ release: mocks.release });
  mocks.create.mockResolvedValue({ id: "usage_1" });
  mocks.update.mockResolvedValue({ id: "usage_1" });
});

describe("AI usage cost estimation", () => {
  it("estimates gpt-4o-mini cost in micro-dollars", () => {
    expect(
      estimateAIUsageCostMicros("gpt-4o-mini", {
        inputTokens: 1_000,
        outputTokens: 500,
      }),
    ).toBe(450);
  });

  it("does not invent a cost for an unknown model", () => {
    expect(
      estimateAIUsageCostMicros("future-model", {
        inputTokens: 1_000,
        outputTokens: 500,
      }),
    ).toBeNull();
  });
});

describe("tracked AI operation", () => {
  it("persists a RUNNING row before the provider call and completes it", async () => {
    const operation = vi.fn().mockResolvedValue({
      object: { ok: true },
      usage: { inputTokens: 100, outputTokens: 50 },
      response: { id: "provider_1", modelId: "gpt-4o-mini" },
    });

    await expect(
      runTrackedAI(
        {
          userId: "user_1",
          feature: "MISSION_PARSING",
          modelId: "gpt-4o-mini",
        },
        operation,
      ),
    ).resolves.toMatchObject({ object: { ok: true } });

    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "RUNNING" }),
      }),
    );
    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "SUCCEEDED",
          requestId: "provider_1",
          estimatedCostMicros: 45,
        }),
      }),
    );
    expect(mocks.release).not.toHaveBeenCalled();
  });

  it("releases the reservation and records a normalized failure", async () => {
    const providerError = Object.assign(new Error("provider down"), {
      statusCode: 503,
    });

    await expect(
      runTrackedAI(
        {
          userId: "user_1",
          feature: "CHAT",
          modelId: "gpt-4o-mini",
        },
        async () => {
          throw providerError;
        },
      ),
    ).rejects.toThrow("provider down");

    expect(mocks.release).toHaveBeenCalledTimes(1);
    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "FAILED",
          errorCode: "HTTP_503",
        }),
      }),
    );
  });
});
