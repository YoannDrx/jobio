/* eslint-disable no-console */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { finalizeDeletedAccountRetention } from "@/features/account/account-deletion";
import { exportAccountData } from "@/features/account/account-data-export";
import { prisma } from "@/lib/prisma";

const runId = randomUUID();
const userId = `account-lifecycle-${runId}`;
const listingExternalId = `account-lifecycle:${runId}`;

const main = async () => {
  try {
    await prisma.user.create({
      data: {
        id: userId,
        name: "Account lifecycle verification",
        email: `${userId}@jobio.app`,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        sessions: {
          create: {
            id: `session-${runId}`,
            token: `secret-session-${runId}`,
            expiresAt: new Date(Date.now() + 3_600_000),
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
        accounts: {
          create: {
            id: `account-${runId}`,
            accountId: `provider-${runId}`,
            providerId: "credential",
            password: `secret-password-${runId}`,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
        missions: {
          create: { title: `Lifecycle mission ${runId}`, stack: [] },
        },
        aiUsages: {
          create: {
            feature: "CHAT",
            inputTokens: 10,
            outputTokens: 5,
            status: "SUCCEEDED",
          },
        },
        userAssets: {
          create: {
            url: `https://example.invalid/${runId}.png`,
            pathname: `uploads/users/${userId}/${runId}.png`,
            provider: "LOCAL",
            mimeType: "image/png",
            sizeBytes: 12,
          },
        },
      },
    });
    await prisma.proTrialIdentity.create({
      data: {
        emailFingerprint: `fingerprint-${runId}`,
        firstUserId: userId,
      },
    });
    const listing = await prisma.opportunityListing.create({
      data: {
        source: "MANUAL",
        externalIdentifier: listingExternalId,
        fingerprint: listingExternalId,
        title: `Lifecycle opportunity ${runId}`,
        skills: [],
        provenance: { provider: "verification" },
      },
    });
    await prisma.opportunityMatch.create({
      data: {
        userId,
        listingId: listing.id,
        score: 75,
        breakdown: {},
        explanation: "verification",
      },
    });
    await prisma.opportunityDigestDelivery.create({
      data: {
        userId,
        digestDate: new Date("2026-08-12T00:00:00.000Z"),
        status: "SENT",
      },
    });

    const exported = await exportAccountData(userId);
    const serialized = JSON.stringify(exported);
    assert.equal(exported.metadata.schemaVersion, 1);
    assert.equal(exported.data.user.id, userId);
    assert.equal(exported.data.user.missions.length, 1);
    assert.equal(exported.data.user.aiUsages.length, 1);
    assert.equal(exported.data.user.opportunityMatches.length, 1);
    assert.equal(exported.data.user.opportunityDigestDeliveries.length, 1);
    assert.equal(exported.data.user.userAssets.length, 1);
    assert.equal(exported.data.trialIdentity?.firstUserId, userId);
    assert.equal(serialized.includes(`secret-session-${runId}`), false);
    assert.equal(serialized.includes(`secret-password-${runId}`), false);

    await prisma.user.delete({ where: { id: userId } });
    await finalizeDeletedAccountRetention(userId);

    const [
      userCount,
      missionCount,
      usageCount,
      matchCount,
      digestCount,
      assetCount,
    ] = await Promise.all([
      prisma.user.count({ where: { id: userId } }),
      prisma.mission.count({ where: { userId } }),
      prisma.aIUsage.count({ where: { userId } }),
      prisma.opportunityMatch.count({ where: { userId } }),
      prisma.opportunityDigestDelivery.count({ where: { userId } }),
      prisma.userAsset.count({ where: { userId } }),
    ]);
    assert.deepEqual(
      [
        userCount,
        missionCount,
        usageCount,
        matchCount,
        digestCount,
        assetCount,
      ],
      [0, 0, 0, 0, 0, 0],
      "all user-owned database rows must be deleted by cascade",
    );
    const retainedIdentity = await prisma.proTrialIdentity.findUniqueOrThrow({
      where: { emailFingerprint: `fingerprint-${runId}` },
    });
    assert.match(retainedIdentity.firstUserId, /^deleted:[a-f0-9]{24}$/);
    assert.ok(retainedIdentity.retentionExpiresAt);

    console.log(
      "[OK] Compte: export portable sans secrets, cascades Radar/IA et rétention anti-abus pseudonymisée vérifiés.",
    );
  } finally {
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.opportunityListing.deleteMany({
      where: { externalIdentifier: listingExternalId },
    });
    await prisma.proTrialIdentity.deleteMany({
      where: { emailFingerprint: `fingerprint-${runId}` },
    });
    await prisma.$disconnect();
  }
};

void main();
