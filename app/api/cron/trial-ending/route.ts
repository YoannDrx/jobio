import { prisma } from "@/lib/prisma";
import { route } from "@/lib/zod-route";
import { sendEmail } from "@/lib/mail/send-email";
import { SiteConfig } from "@/site-config";
import TrialEndingEmail from "@email/trial-ending.email";
import { NextResponse } from "next/server";
import { finishCronJobRun, startCronJobRun } from "@/lib/ops/cron-job-runs";
import { validateCronAuthorization } from "@/lib/security/cron-auth";

export const GET = route.handler(async (req) => {
  const run = await startCronJobRun({
    jobName: "trial-ending",
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

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const startOfDay = new Date(
    tomorrow.getFullYear(),
    tomorrow.getMonth(),
    tomorrow.getDate(),
  );
  const endOfDay = new Date(
    tomorrow.getFullYear(),
    tomorrow.getMonth(),
    tomorrow.getDate(),
    23,
    59,
    59,
    999,
  );

  try {
    const preferences = await prisma.userPreference.findMany({
      where: {
        proTrialConsumedAt: null,
        proTrialEndsAt: {
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
          !["active", "past_due"].includes(user.subscription.status ?? ""),
      );

    const results = await Promise.all(
      validUsers.map(async (user) =>
        sendEmail(
          {
            to: user.email,
            subject: `Ton essai ${SiteConfig.title} se termine demain`,
            html: TrialEndingEmail({
              name: user.name || "Freelance",
              daysLeft: 1,
            }),
          },
          { idempotencyKey: `trial-ending-${user.id}` },
        ),
      ),
    );

    await finishCronJobRun(run?.id, {
      status: "SUCCESS",
      processedCount: results.length,
      details: {
        trialCandidates: preferences.length,
      },
    });

    return NextResponse.json({ sent: results.length });
  } catch (error) {
    await finishCronJobRun(run?.id, {
      status: "FAILED",
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json({ error: "Cron failure" }, { status: 500 });
  }
});
