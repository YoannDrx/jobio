const RETRYABLE_READ_OPERATIONS = new Set([
  "aggregate",
  "count",
  "findFirst",
  "findFirstOrThrow",
  "findMany",
  "findUnique",
  "findUniqueOrThrow",
  "groupBy",
]);

const RETRYABLE_CONNECTION_CODES = new Set(["P1001", "P1017"]);

const getPrismaErrorCode = (error: unknown) => {
  if (typeof error !== "object" || error === null) {
    return null;
  }

  if ("code" in error && typeof error.code === "string") {
    return error.code;
  }

  if (
    "name" in error &&
    error.name === "PrismaClientInitializationError" &&
    "message" in error &&
    typeof error.message === "string" &&
    error.message.includes("Can't reach database server")
  ) {
    return "P1001";
  }

  return null;
};

export const canRetryTransientPrismaRead = (
  operation: string,
  error: unknown,
) =>
  RETRYABLE_READ_OPERATIONS.has(operation) &&
  RETRYABLE_CONNECTION_CODES.has(getPrismaErrorCode(error) ?? "");

export const runPrismaReadWithTransientRetry = async <T>(input: {
  operation: string;
  query: () => Promise<T>;
  onRetry?: (error: unknown) => void;
  retryDelayMs?: number;
}) => {
  try {
    return await input.query();
  } catch (error) {
    if (!canRetryTransientPrismaRead(input.operation, error)) {
      throw error;
    }

    input.onRetry?.(error);
    const retryDelayMs = input.retryDelayMs ?? 250;
    if (retryDelayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
    }
    return input.query();
  }
};
