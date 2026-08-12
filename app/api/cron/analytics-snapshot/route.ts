import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { route } from "@/lib/zod-route";
import { captureSnapshot } from "@/features/analytics/analytics-snapshot";
import { finishCronJobRun, startCronJobRun } from "@/lib/ops/cron-job-runs";
import { logger } from "@/lib/logger";
import { validateCronAuthorization } from "@/lib/security/cron-auth";

const RETENTION_DAYS: Record<string, number | undefined> = {
  free: 7,
  pro: 90,
};

async function processUser(
  userId: string,
  planName: string,
  today: Date,
): Promise<boolean> {
  try {
    const snapshotData = await captureSnapshot(userId);

    await prisma.analyticsSnapshot.upsert({
      where: {
        userId_type_date: {
          userId,
          type: "DAILY",
          date: today,
        },
      },
      update: {
        data: snapshotData,
      },
      create: {
        userId,
        type: "DAILY",
        date: today,
        data: snapshotData,
      },
    });

    const retentionDays = RETENTION_DAYS[planName];

    if (retentionDays !== undefined) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      await prisma.analyticsSnapshot.deleteMany({
        where: {
          userId,
          date: { lt: cutoffDate },
        },
      });
    }

    return true;
  } catch (error) {
    logger.error(`Failed to capture snapshot for user ${userId}`, error);
    return false;
  }
}

export const POST = route.handler(async (req) => {
  const run = await startCronJobRun({
    jobName: "analytics-snapshot",
    route: new URL(req.url).pathname,
  });

  const authFailure = validateCronAuthorization(
    req.headers.get("authorization"),
  );
  if (authFailure) {
    await finishCronJobRun(run?.id, {
      status: authFailure.status === 401 ? "UNAUTHORIZED" : "FAILED",
      errorMessage: authFailure.logMessage,
    });
    return NextResponse.json(
      { error: authFailure.publicError },
      { status: authFailure.status },
    );
  }

  try {
    const usersWithMissions = await prisma.user.findMany({
      where: {
        missions: {
          some: { deletedAt: null },
        },
      },
      select: {
        id: true,
        subscription: {
          select: { plan: true },
        },
      },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const results = await Promise.all(
      usersWithMissions.map(async (user) =>
        processUser(user.id, user.subscription?.plan ?? "free", today),
      ),
    );

    const processed = results.filter(Boolean).length;

    await finishCronJobRun(run?.id, {
      status: "SUCCESS",
      processedCount: processed,
      details: {
        totalUsers: usersWithMissions.length,
      },
    });

    return NextResponse.json({ processed });
  } catch (error) {
    await finishCronJobRun(run?.id, {
      status: "FAILED",
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json({ error: "Cron failure" }, { status: 500 });
  }
});
