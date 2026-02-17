import type { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

type SystemErrorSeverity = "INFO" | "WARNING" | "ERROR" | "CRITICAL";

type LogSystemErrorInput = {
  source: string;
  message: string;
  stack?: string;
  severity?: SystemErrorSeverity;
  context?: Record<string, unknown>;
  userId?: string;
  userEmail?: string;
  route?: string;
};

export function logSystemError(input: LogSystemErrorInput) {
  void prisma.systemErrorLog
    .create({
      data: {
        source: input.source,
        message: input.message,
        stack: input.stack,
        severity: input.severity ?? "ERROR",
        context: input.context as Prisma.InputJsonValue | undefined,
        userId: input.userId,
        userEmail: input.userEmail,
        route: input.route,
      },
    })
    .catch((error) => {
      logger.error("Impossible d'enregistrer le log d'erreur système", error);
    });
}
