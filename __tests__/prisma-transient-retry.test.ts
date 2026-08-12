import {
  canRetryTransientPrismaRead,
  runPrismaReadWithTransientRetry,
} from "@/lib/prisma-transient-retry";
import { describe, expect, it, vi } from "vitest";

describe("Prisma transient read retry", () => {
  it("retries a read once after a closed server connection", async () => {
    const query = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce({ code: "P1017" })
      .mockResolvedValueOnce("connected");
    const onRetry = vi.fn();

    await expect(
      runPrismaReadWithTransientRetry({
        operation: "findFirst",
        query,
        onRetry,
        retryDelayMs: 0,
      }),
    ).resolves.toBe("connected");
    expect(query).toHaveBeenCalledTimes(2);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("never retries writes or non-transient errors", async () => {
    expect(canRetryTransientPrismaRead("create", { code: "P1017" })).toBe(
      false,
    );
    expect(canRetryTransientPrismaRead("findMany", { code: "P2002" })).toBe(
      false,
    );
    expect(
      canRetryTransientPrismaRead("findUnique", {
        name: "PrismaClientInitializationError",
        message: "Can't reach database server at example.test:5432",
      }),
    ).toBe(true);

    const error = { code: "P1017" };
    const query = vi.fn<() => Promise<never>>().mockRejectedValue(error);
    await expect(
      runPrismaReadWithTransientRetry({ operation: "update", query }),
    ).rejects.toBe(error);
    expect(query).toHaveBeenCalledTimes(1);
  });
});
