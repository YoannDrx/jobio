import { prisma } from "@/lib/prisma";
import { route } from "@/lib/zod-route";
import { NextResponse } from "next/server";
import { finishCronJobRun, startCronJobRun } from "@/lib/ops/cron-job-runs";
import { sendPushNotification } from "@/features/notifications/push/push-service";
import { validateCronAuthorization } from "@/lib/security/cron-auth";

export const GET = route.handler(async (req) => {
  const run = await startCronJobRun({
    jobName: "push-notifications",
    route: new URL(req.url).pathname,
  });

  const authFailure = validateCronAuthorization(req.headers.get("authorization"));
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
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const endOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999,
    );

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Follow-ups due today
    const dueToday = await prisma.followUp.findMany({
      where: {
        completedAt: null,
        scheduledAt: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
      include: { mission: { select: { title: true, company: true } } },
    });

    // Overdue follow-ups (before today, not completed)
    const overdue = await prisma.followUp.findMany({
      where: {
        completedAt: null,
        scheduledAt: { lt: startOfToday },
      },
      include: { mission: { select: { title: true, company: true } } },
    });

    // Stale missions (no activity in 7+ days, still active)
    const staleMissions = await prisma.mission.findMany({
      where: {
        deletedAt: null,
        status: { in: ["POSTULE", "ENTRETIEN", "PROPOSITION"] },
        updatedAt: { lt: sevenDaysAgo },
      },
    });

    let totalSent = 0;

    // Group due today follow-ups by user
    const dueTodayByUser = new Map<
      string,
      { title: string; company: string | null }[]
    >();
    for (const followUp of dueToday) {
      const list = dueTodayByUser.get(followUp.userId) ?? [];
      list.push({
        title: followUp.mission.title,
        company: followUp.mission.company,
      });
      dueTodayByUser.set(followUp.userId, list);
    }

    const dueTodayNotifications = [...dueTodayByUser.entries()].map(
      async ([userId, missions]) => {
        const count = missions.length;
        const first = missions[0];
        const body =
          count === 1
            ? `Relance prévue : ${first.title}${first.company ? ` (${first.company})` : ""}`
            : `${count} relances prévues aujourd'hui`;

        return sendPushNotification(userId, {
          title: "Relances du jour",
          body,
          url: "/job/prospection",
        });
      },
    );
    await Promise.all(dueTodayNotifications);
    totalSent += dueTodayNotifications.length;

    // Group overdue follow-ups by user
    const overdueByUser = new Map<string, number>();
    for (const followUp of overdue) {
      overdueByUser.set(
        followUp.userId,
        (overdueByUser.get(followUp.userId) ?? 0) + 1,
      );
    }

    const overdueNotifications = [...overdueByUser.entries()].map(
      async ([userId, count]) =>
        sendPushNotification(userId, {
          title: "Relances en retard",
          body: `${count} relance${count > 1 ? "s" : ""} en retard`,
          url: "/job/prospection",
        }),
    );
    await Promise.all(overdueNotifications);
    totalSent += overdueNotifications.length;

    // Group stale missions by user
    const staleByUser = new Map<string, number>();
    for (const mission of staleMissions) {
      staleByUser.set(
        mission.userId,
        (staleByUser.get(mission.userId) ?? 0) + 1,
      );
    }

    const staleNotifications = [...staleByUser.entries()].map(
      async ([userId, count]) =>
        sendPushNotification(userId, {
          title: "Missions sans activité",
          body: `${count} mission${count > 1 ? "s" : ""} sans activité depuis 7+ jours`,
          url: "/job/prospection",
        }),
    );
    await Promise.all(staleNotifications);
    totalSent += staleNotifications.length;

    await finishCronJobRun(run?.id, {
      status: "SUCCESS",
      processedCount: totalSent,
      details: {
        dueToday: dueToday.length,
        overdue: overdue.length,
        staleMissions: staleMissions.length,
      },
    });

    return NextResponse.json({
      sent: totalSent,
      dueToday: dueToday.length,
      overdue: overdue.length,
      staleMissions: staleMissions.length,
    });
  } catch (error) {
    await finishCronJobRun(run?.id, {
      status: "FAILED",
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json({ error: "Cron failure" }, { status: 500 });
  }
});
