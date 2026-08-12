/* eslint-disable no-await-in-loop -- provider sync is intentionally capped and sequential to avoid bursts */
import { syncOpportunityWatch } from "@/features/opportunities/opportunity-service";
import { finishCronJobRun, startCronJobRun } from "@/lib/ops/cron-job-runs";
import { prisma } from "@/lib/prisma";
import { validateCronAuthorization } from "@/lib/security/cron-auth";
import { route } from "@/lib/zod-route";
import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/mail/send-email";
import OpportunityDigestEmail from "@email/opportunity-digest.email";
import {
  deliverOpportunityDigest,
  getOpportunityDigestDate,
} from "@/features/opportunities/opportunity-digest";

const MAX_WATCHES_PER_RUN = 50;

export const GET = route.handler(async (req) => {
  const run = await startCronJobRun({
    jobName: "opportunity-sync",
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

  const staleBefore = new Date(Date.now() - 20 * 60 * 60 * 1000);
  const watches = await prisma.opportunityWatch.findMany({
    where: {
      isActive: true,
      OR: [{ lastSyncedAt: null }, { lastSyncedAt: { lt: staleBefore } }],
    },
    orderBy: [{ lastSyncedAt: "asc" }, { createdAt: "asc" }],
    take: MAX_WATCHES_PER_RUN,
    select: { id: true, userId: true },
  });
  let succeeded = 0;
  let failed = 0;
  for (const watch of watches) {
    try {
      await syncOpportunityWatch(watch.userId, watch.id);
      succeeded += 1;
    } catch {
      failed += 1;
    }
  }
  const userIds = [...new Set(watches.map((watch) => watch.userId))];
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const digestUsers = await prisma.user.findMany({
    where: {
      id: { in: userIds },
      preference: { opportunityDigest: true },
      opportunityMatches: {
        some: { status: "NEW", createdAt: { gte: since } },
      },
    },
    select: {
      id: true,
      email: true,
      name: true,
      opportunityMatches: {
        where: { status: "NEW", createdAt: { gte: since } },
        include: { listing: true },
        orderBy: [{ score: "desc" }, { createdAt: "desc" }],
        take: 10,
      },
    },
  });
  const digestDate = getOpportunityDigestDate().toISOString().slice(0, 10);
  const digestResults = await Promise.all(
    digestUsers.map(async (user) =>
      deliverOpportunityDigest({
        userId: user.id,
        send: async () =>
          sendEmail(
            {
              to: user.email,
              subject: `${user.opportunityMatches.length} opportunité(s) dans ton Radar`,
              html: OpportunityDigestEmail({
                name: user.name,
                opportunities: user.opportunityMatches.map((match) => ({
                  title: match.listing.title,
                  company: match.listing.company,
                  score: match.score,
                  source: match.listing.source,
                })),
              }),
            },
            { idempotencyKey: `opportunity-digest-${user.id}-${digestDate}` },
          ),
      }),
    ),
  );
  const digestFailures = digestResults.filter(
    (result) => result === "failed",
  ).length;
  const digestsSent = digestResults.filter(
    (result) => result === "sent",
  ).length;
  const digestsSkipped = digestResults.filter(
    (result) => result === "skipped",
  ).length;
  await finishCronJobRun(run?.id, {
    status: failed === 0 && digestFailures === 0 ? "SUCCESS" : "FAILED",
    processedCount: succeeded,
    details: {
      candidates: watches.length,
      succeeded,
      failed,
      digestsSent,
      digestFailures,
      digestsSkipped,
    },
  });
  return NextResponse.json(
    {
      candidates: watches.length,
      succeeded,
      failed,
      digestsSent,
      digestFailures,
      digestsSkipped,
    },
    { status: failed === 0 && digestFailures === 0 ? 200 : 503 },
  );
});
