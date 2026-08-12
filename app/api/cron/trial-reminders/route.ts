import { prisma } from "@/lib/prisma";
import { route } from "@/lib/zod-route";
import { sendEmail } from "@/lib/mail/send-email";
import { SiteConfig } from "@/site-config";
import TrialDay3Email from "@email/trial-day3.email";
import TrialReminderEmail from "@email/trial-reminder.email";
import TrialDay12Email from "@email/trial-day12.email";
import { NextResponse } from "next/server";
import { finishCronJobRun, startCronJobRun } from "@/lib/ops/cron-job-runs";
import { validateCronAuthorization } from "@/lib/security/cron-auth";
import { purgeExpiredTrialIdentities } from "@/lib/auth/stripe/pro-trial";

type DripConfig = {
  daysAgo: number;
  sendFn: (user: {
    email: string;
    name: string | null;
    id: string;
  }) => Promise<void>;
};

const DRIP_SCHEDULE: DripConfig[] = [
  {
    daysAgo: 3,
    sendFn: async (user) => {
      await sendEmail(
        {
          to: user.email,
          subject: `3 astuces pour booster ta prospection ${SiteConfig.title}`,
          html: TrialDay3Email({ name: user.name ?? "Freelance" }),
        },
        { idempotencyKey: `trial-reminder-day-3-${user.id}` },
      );
    },
  },
  {
    daysAgo: 7,
    sendFn: async (user) => {
      const [missionsCount, followUpsCount] = await Promise.all([
        prisma.mission.count({ where: { userId: user.id, deletedAt: null } }),
        prisma.followUp.count({
          where: { userId: user.id, completedAt: { not: null } },
        }),
      ]);
      await sendEmail(
        {
          to: user.email,
          subject: `Une semaine avec ${SiteConfig.title} !`,
          html: TrialReminderEmail({
            name: user.name ?? "Freelance",
            missionsCount,
            followUpsCount,
          }),
        },
        { idempotencyKey: `trial-reminder-day-7-${user.id}` },
      );
    },
  },
  {
    daysAgo: 12,
    sendFn: async (user) => {
      const missionsCount = await prisma.mission.count({
        where: { userId: user.id, deletedAt: null },
      });
      await sendEmail(
        {
          to: user.email,
          subject: `Plus que 2 jours d'essai ${SiteConfig.title}`,
          html: TrialDay12Email({
            name: user.name ?? "Freelance",
            missionsCount,
          }),
        },
        { idempotencyKey: `trial-reminder-day-12-${user.id}` },
      );
    },
  },
];

export const GET = route.handler(async (req) => {
  const run = await startCronJobRun({
    jobName: "trial-reminders",
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
    const [results, purgedTrialIdentities] = await Promise.all([
      Promise.all(
        DRIP_SCHEDULE.map(async (config) => {
          const targetDate = new Date();
          targetDate.setDate(targetDate.getDate() - config.daysAgo);

          const startOfDay = new Date(
            targetDate.getFullYear(),
            targetDate.getMonth(),
            targetDate.getDate(),
          );
          const endOfDay = new Date(
            targetDate.getFullYear(),
            targetDate.getMonth(),
            targetDate.getDate(),
            23,
            59,
            59,
            999,
          );

          const preferences = await prisma.userPreference.findMany({
            where: {
              proTrialConsumedAt: null,
              proTrialStartedAt: {
                gte: startOfDay,
                lte: endOfDay,
              },
            },
            include: {
              user: { include: { subscription: true } },
            },
          });

          const validUsers = preferences
            .map((preference) => preference.user)
            .filter(
              (user) =>
                !user.subscription ||
                !["active", "past_due"].includes(
                  user.subscription.status ?? "",
                ),
            );

          await Promise.all(
            validUsers.map(async (user) => config.sendFn(user)),
          );
          return validUsers.length;
        }),
      ),
      purgeExpiredTrialIdentities(),
    ]);

    const totalSent = results.reduce((sum, count) => sum + count, 0);

    await finishCronJobRun(run?.id, {
      status: "SUCCESS",
      processedCount: totalSent,
      details: {
        byStep: results,
        purgedTrialIdentities: purgedTrialIdentities.count,
      },
    });

    return NextResponse.json({
      sent: totalSent,
      purgedTrialIdentities: purgedTrialIdentities.count,
    });
  } catch (error) {
    await finishCronJobRun(run?.id, {
      status: "FAILED",
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json({ error: "Cron failure" }, { status: 500 });
  }
});
