/* eslint-disable no-console */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import {
  convertOpportunityMatchToMission,
  getOpportunityDashboard,
  ingestOpportunityForUser,
} from "@/features/opportunities/opportunity-service";
import { deliverOpportunityDigest } from "@/features/opportunities/opportunity-digest";
import type { NormalizedOpportunity } from "@/features/opportunities/opportunities.schema";
import { prisma } from "@/lib/prisma";

const runId = randomUUID();
const externalPrefix = `radar-verify:${runId}`;
const userIds = [`radar-a-${runId}`, `radar-b-${runId}`];

const createUser = async (id: string, suffix: string) =>
  prisma.user.create({
    data: {
      id,
      name: `Radar verification ${suffix}`,
      email: `${id}@jobio.app`,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

const opportunity = (
  source: "MANUAL" | "INBOUND_EMAIL",
  externalIdentifier: string,
): NormalizedOpportunity => ({
  source,
  externalIdentifier,
  canonicalUrl: null,
  title: `Lead TypeScript ${runId}`,
  company: "Jobio verification",
  description: "Mission TypeScript React entièrement remote.",
  location: "France",
  workType: "REMOTE",
  skills: ["TypeScript", "React"],
  dailyRateMin: 600,
  dailyRateMax: 700,
  salaryMin: null,
  salaryMax: null,
  currency: "EUR",
  duration: "6 mois",
  publishedAt: new Date(),
  expiresAt: null,
  provenance: { provider: "verification" },
});

const criteria = {
  titles: ["Lead TypeScript"],
  skills: ["TypeScript"],
  workTypes: ["REMOTE" as const],
  excludedKeywords: [],
};

const main = async () => {
  try {
    await Promise.all([
      createUser(userIds[0], "A"),
      createUser(userIds[1], "B"),
    ]);

    const first = await ingestOpportunityForUser({
      userId: userIds[0],
      opportunity: opportunity("MANUAL", `${externalPrefix}:manual`),
      criteria,
      profile: null,
    });
    const duplicate = await ingestOpportunityForUser({
      userId: userIds[0],
      opportunity: opportunity("INBOUND_EMAIL", `${externalPrefix}:email`),
      criteria,
      profile: null,
    });

    assert.equal(first.matched, true);
    assert.equal(duplicate.matched, true);
    if (!first.matchId) throw new Error("Radar verification match missing");
    const matchId = first.matchId;
    assert.equal(
      duplicate.matchId,
      matchId,
      "a cross-source duplicate must reuse the user match",
    );

    const [dashboardA, dashboardB] = await Promise.all([
      getOpportunityDashboard(userIds[0]),
      getOpportunityDashboard(userIds[1]),
    ]);
    assert.equal(dashboardA.total, 1);
    assert.equal(dashboardB.total, 0, "user B must not see user A data");

    await assert.rejects(
      convertOpportunityMatchToMission({
        userId: userIds[1],
        matchId,
      }),
      /Opportunité introuvable/,
    );

    const conversions = await Promise.allSettled([
      convertOpportunityMatchToMission({
        userId: userIds[0],
        matchId,
      }),
      convertOpportunityMatchToMission({
        userId: userIds[0],
        matchId,
      }),
    ]);
    assert.equal(
      conversions.filter((result) => result.status === "fulfilled").length,
      1,
      "exactly one concurrent conversion must succeed",
    );
    assert.equal(
      await prisma.mission.count({
        where: { userId: userIds[0], title: `Lead TypeScript ${runId}` },
      }),
      1,
      "conversion must create one mission only",
    );

    const expiredListing = await prisma.opportunityListing.create({
      data: {
        source: "MANUAL",
        externalIdentifier: `${externalPrefix}:expired`,
        fingerprint: `${externalPrefix}:expired`,
        title: `Expired ${runId}`,
        skills: [],
        provenance: { provider: "verification" },
        expiresAt: new Date(Date.now() - 60_000),
      },
    });
    const expiredMatch = await prisma.opportunityMatch.create({
      data: {
        userId: userIds[0],
        listingId: expiredListing.id,
        score: 50,
        breakdown: {},
        explanation: "verification",
      },
    });
    await assert.rejects(
      convertOpportunityMatchToMission({
        userId: userIds[0],
        matchId: expiredMatch.id,
      }),
      /expiré/,
    );

    let digestSendCount = 0;
    const digestNow = new Date("2026-08-12T08:00:00.000Z");
    const digestResults = await Promise.all([
      deliverOpportunityDigest({
        userId: userIds[0],
        now: digestNow,
        send: async () => {
          digestSendCount += 1;
          return { error: null, data: { id: `${externalPrefix}:digest` } };
        },
      }),
      deliverOpportunityDigest({
        userId: userIds[0],
        now: digestNow,
        send: async () => {
          digestSendCount += 1;
          return { error: null, data: { id: `${externalPrefix}:duplicate` } };
        },
      }),
    ]);
    assert.equal(digestSendCount, 1, "a digest must be sent once per UTC day");
    assert.deepEqual(
      digestResults.sort(),
      ["sent", "skipped"],
      "a concurrent digest must be skipped after the atomic claim",
    );

    console.log(
      "[OK] Radar: isolation, déduplication multi-source, expiration, conversion et digest concurrents vérifiés.",
    );
  } finally {
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await prisma.opportunityListing.deleteMany({
      where: { externalIdentifier: { startsWith: externalPrefix } },
    });
    await prisma.$disconnect();
  }
};

void main();
