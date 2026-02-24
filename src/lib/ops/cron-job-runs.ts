import { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

type CronRunStatus = "RUNNING" | "SUCCESS" | "FAILED" | "UNAUTHORIZED";

const isMissingCronJobTable = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021";

export async function findActiveCronJobRun(input: {
  jobNames: string[];
  maxAgeMinutes?: number;
}) {
  const maxAgeMinutes = input.maxAgeMinutes ?? 90;
  const startedAfter = new Date(Date.now() - maxAgeMinutes * 60_000);

  try {
    return await prisma.cronJobRun.findFirst({
      where: {
        status: "RUNNING",
        jobName: { in: input.jobNames },
        startedAt: { gte: startedAfter },
      },
      orderBy: { startedAt: "desc" },
      select: {
        id: true,
        jobName: true,
        startedAt: true,
        route: true,
      },
    });
  } catch (error) {
    if (isMissingCronJobTable(error)) {
      return null;
    }
    logger.error("Impossible de verifier les cron jobs actifs", error);
    return null;
  }
}

export async function startCronJobRun(input: { jobName: string; route: string }) {
  try {
    return await prisma.cronJobRun.create({
      data: {
        jobName: input.jobName,
        route: input.route,
        status: "RUNNING",
      },
      select: {
        id: true,
        startedAt: true,
      },
    });
  } catch (error) {
    if (isMissingCronJobTable(error)) {
      return null;
    }
    logger.error("Impossible d'initialiser un log de cron job", error);
    return null;
  }
}

export async function finishCronJobRun(
  runId: string | null | undefined,
  input: {
    status: CronRunStatus;
    processedCount?: number;
    details?: Record<string, unknown>;
    errorMessage?: string;
  },
) {
  if (!runId) {
    return;
  }

  const finishedAt = new Date();

  try {
    const existing = await prisma.cronJobRun.findUnique({
      where: { id: runId },
      select: { startedAt: true },
    });

    const durationMs = existing
      ? Math.max(0, finishedAt.getTime() - existing.startedAt.getTime())
      : null;

    await prisma.cronJobRun.update({
      where: { id: runId },
      data: {
        status: input.status,
        processedCount: input.processedCount,
        details: input.details as Prisma.InputJsonValue | undefined,
        errorMessage: input.errorMessage,
        finishedAt,
        durationMs: durationMs ?? undefined,
      },
    });
  } catch (error) {
    if (isMissingCronJobTable(error)) {
      return;
    }
    logger.error("Impossible de finaliser un log de cron job", error);
  }
}
