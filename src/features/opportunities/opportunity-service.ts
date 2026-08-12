/* eslint-disable no-await-in-loop -- sources and listings are ingested sequentially to respect provider and database limits */
import {
  ActivityEventType,
  OpportunityMatchStatus,
  OpportunitySourceRunStatus,
  Prisma,
} from "@/generated/prisma";
import { ApplicationError } from "@/lib/errors/application-error";
import { enforcePlanFeature } from "@/lib/plan-limits";
import { prisma } from "@/lib/prisma";
import {
  createOpportunityFingerprint,
  normalizeOpportunityText,
} from "./opportunity-normalization";
import { scoreOpportunity } from "./opportunity-scoring";
import {
  opportunityCriteriaSchema,
  opportunityMatchFilterSchema,
  type NormalizedOpportunity,
  type OpportunityCriteria,
} from "./opportunities.schema";
import { opportunityProviders } from "./providers";

const dbListingData = (opportunity: NormalizedOpportunity) => ({
  canonicalUrl: opportunity.canonicalUrl,
  fingerprint: createOpportunityFingerprint(opportunity),
  title: opportunity.title,
  company: opportunity.company,
  description: opportunity.description,
  location: opportunity.location,
  workType: opportunity.workType,
  skills: opportunity.skills,
  dailyRateMin: opportunity.dailyRateMin,
  dailyRateMax: opportunity.dailyRateMax,
  salaryMin: opportunity.salaryMin,
  salaryMax: opportunity.salaryMax,
  currency: opportunity.currency,
  duration: opportunity.duration,
  provenance: opportunity.provenance as Prisma.InputJsonValue,
  publishedAt: opportunity.publishedAt,
  expiresAt: opportunity.expiresAt,
  lastSeenAt: new Date(),
});

type OpportunityProfile = {
  skills: Prisma.JsonValue;
  tjmTarget: number | null;
  workTypePreference: string | null;
  zone: string | null;
};

export const ingestOpportunityForUser = async ({
  userId,
  opportunity,
  criteria,
  profile,
  watchId,
}: {
  userId: string;
  opportunity: NormalizedOpportunity;
  criteria: OpportunityCriteria;
  profile: OpportunityProfile | null;
  watchId?: string;
}): Promise<{ matched: boolean; matchId: string | null }> => {
  const data = dbListingData(opportunity);
  const listing = await prisma.opportunityListing.upsert({
    where: {
      source_externalIdentifier: {
        source: opportunity.source,
        externalIdentifier: opportunity.externalIdentifier,
      },
    },
    create: {
      source: opportunity.source,
      externalIdentifier: opportunity.externalIdentifier,
      ...data,
    },
    update: data,
  });

  if (watchId) {
    await prisma.opportunityWatchHit.upsert({
      where: { watchId_listingId: { watchId, listingId: listing.id } },
      create: { watchId, listingId: listing.id },
      update: { lastMatchedAt: new Date() },
    });
  }

  const scoring = scoreOpportunity(opportunity, criteria, profile);
  if (!scoring.eligible) return { matched: false, matchId: null };

  const sameOpportunity = await prisma.opportunityMatch.findFirst({
    where: {
      userId,
      listing: { fingerprint: listing.fingerprint },
    },
    select: { id: true, listingId: true },
  });
  const targetListingId = sameOpportunity?.listingId ?? listing.id;
  const explanation =
    scoring.reasons.join(" · ") ||
    "Correspondance selon les critères de veille";
  const match = await prisma.opportunityMatch.upsert({
    where: {
      userId_listingId: { userId, listingId: targetListingId },
    },
    create: {
      userId,
      listingId: targetListingId,
      score: scoring.score,
      breakdown: scoring.breakdown,
      explanation,
    },
    update: {
      score: scoring.score,
      breakdown: scoring.breakdown,
      explanation,
    },
    select: { id: true },
  });
  return { matched: true, matchId: match.id };
};

export const syncOpportunityWatch = async (
  userId: string,
  watchId: string,
): Promise<{ fetched: number; matched: number; skipped: string[] }> => {
  await enforcePlanFeature(userId, "opportunityDiscovery");
  const watch = await prisma.opportunityWatch.findFirst({
    where: { id: watchId, userId },
  });
  if (!watch) throw new Error("Opportunity watch not found");
  const staleClaim = new Date(Date.now() - 30 * 60 * 1000);
  const claim = await prisma.opportunityWatch.updateMany({
    where: {
      id: watch.id,
      userId,
      OR: [{ syncStartedAt: null }, { syncStartedAt: { lt: staleClaim } }],
    },
    data: { syncStartedAt: new Date() },
  });
  if (claim.count === 0) {
    return {
      fetched: 0,
      matched: 0,
      skipped: ["SYNC_ALREADY_RUNNING"],
    };
  }

  const criteria = opportunityCriteriaSchema.parse(watch.criteria);
  const profile = await prisma.userProfile.findFirst({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
    select: {
      skills: true,
      tjmTarget: true,
      workTypePreference: true,
      zone: true,
    },
  });
  let fetched = 0;
  let matched = 0;
  const skipped: string[] = [];

  for (const provider of opportunityProviders) {
    if (!watch.sources.includes(provider.source)) continue;
    const startedAt = new Date();
    const run = await prisma.opportunitySourceRun.create({
      data: {
        userId,
        watchId,
        provider: provider.source,
        status: provider.isConfigured()
          ? OpportunitySourceRunStatus.RUNNING
          : OpportunitySourceRunStatus.SKIPPED,
      },
    });
    if (!provider.isConfigured()) {
      skipped.push(provider.source);
      await prisma.opportunitySourceRun.update({
        where: { id: run.id },
        data: {
          finishedAt: new Date(),
          errorCode: "PROVIDER_NOT_CONFIGURED",
          latencyMs: Date.now() - startedAt.getTime(),
        },
      });
      continue;
    }

    let cursor: string | null = null;
    try {
      let providerMatches = 0;
      let providerFetched = 0;
      let pages = 0;
      do {
        const page = await provider.search(criteria, cursor);
        for (const opportunity of page.items) {
          const result = await ingestOpportunityForUser({
            userId,
            opportunity,
            criteria,
            profile,
            watchId,
          });
          if (result.matched) providerMatches += 1;
        }
        providerFetched += page.items.length;
        cursor = page.nextCursor;
        pages += 1;
      } while (cursor && pages < 3);
      fetched += providerFetched;
      matched += providerMatches;
      await prisma.opportunitySourceRun.update({
        where: { id: run.id },
        data: {
          status: OpportunitySourceRunStatus.SUCCEEDED,
          cursor,
          fetchedCount: providerFetched,
          matchedCount: providerMatches,
          latencyMs: Date.now() - startedAt.getTime(),
          finishedAt: new Date(),
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      await prisma.opportunitySourceRun.update({
        where: { id: run.id },
        data: {
          status: OpportunitySourceRunStatus.FAILED,
          cursor,
          errorCode: "PROVIDER_REQUEST_FAILED",
          errorMessage: message.slice(0, 500),
          latencyMs: Date.now() - startedAt.getTime(),
          finishedAt: new Date(),
        },
      });
    }
  }

  await prisma.opportunityWatch.update({
    where: { id: watch.id },
    data: { lastSyncedAt: new Date(), syncStartedAt: null },
  });
  return { fetched, matched, skipped };
};

export const getOpportunityDashboard = async (
  userId: string,
  rawFilters?: unknown,
) => {
  const filters = opportunityMatchFilterSchema.parse(rawFilters ?? {});
  await prisma.opportunityMatch.updateMany({
    where: {
      userId,
      status: { in: ["NEW", "SAVED"] },
      listing: { expiresAt: { lt: new Date() } },
    },
    data: { status: "EXPIRED" },
  });
  const [watches, matches, total, inbox, preferences] =
    await prisma.$transaction([
      prisma.opportunityWatch.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        include: {
          sourceRuns: {
            orderBy: { startedAt: "desc" },
            take: 1,
            select: {
              status: true,
              fetchedCount: true,
              matchedCount: true,
              errorCode: true,
              startedAt: true,
            },
          },
        },
      }),
      prisma.opportunityMatch.findMany({
        where: {
          userId,
          status: filters.status,
          score: { gte: filters.minScore },
        },
        include: { listing: true },
        orderBy: [{ score: "desc" }, { createdAt: "desc" }],
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize,
      }),
      prisma.opportunityMatch.count({
        where: {
          userId,
          status: filters.status,
          score: { gte: filters.minScore },
        },
      }),
      prisma.opportunityInbox.findUnique({ where: { userId } }),
      prisma.userPreference.findUnique({
        where: { userId },
        select: { opportunityDigest: true },
      }),
    ]);
  return {
    watches,
    matches,
    total,
    inbox,
    opportunityDigestEnabled: preferences?.opportunityDigest ?? true,
  };
};

export const opportunityEmailAddress = (addressToken: string): string =>
  `${addressToken}@${process.env.OPPORTUNITY_INBOUND_DOMAIN ?? "opportunites.jobio.fr"}`;

export const extractManualOpportunity = ({
  content,
  sourceUrl,
  userId,
}: {
  content: string;
  sourceUrl?: string;
  userId: string;
}): NormalizedOpportunity => {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const title = lines[0]?.slice(0, 300) || "Opportunité importée";
  const skillVocabulary = [
    "TypeScript",
    "JavaScript",
    "React",
    "Next.js",
    "Node.js",
    "Python",
    "Java",
    "AWS",
    "Azure",
    "Docker",
    "Kubernetes",
    "PostgreSQL",
  ];
  const normalized = normalizeOpportunityText(content);
  const skills = skillVocabulary.filter((skill) =>
    normalized.includes(normalizeOpportunityText(skill)),
  );
  return {
    source: "MANUAL",
    externalIdentifier: `manual:${userId}:${createOpportunityFingerprint({
      title,
      company: null,
      location: null,
      dailyRateMin: null,
      salaryMin: null,
    })}`,
    canonicalUrl: sourceUrl ?? null,
    title,
    company: null,
    description: content,
    location: null,
    workType: null,
    skills,
    dailyRateMin: null,
    dailyRateMax: null,
    salaryMin: null,
    salaryMax: null,
    currency: "EUR",
    duration: null,
    publishedAt: new Date(),
    expiresAt: null,
    provenance: {
      provider: "Saisie utilisateur",
      importedAt: new Date().toISOString(),
    },
  };
};

export const statusTimestamps = (status: OpportunityMatchStatus) => ({
  savedAt: status === OpportunityMatchStatus.SAVED ? new Date() : undefined,
  dismissedAt:
    status === OpportunityMatchStatus.DISMISSED ? new Date() : undefined,
});

export const convertOpportunityMatchToMission = async ({
  userId,
  matchId,
}: {
  userId: string;
  matchId: string;
}) =>
  prisma.$transaction(
    async (tx) => {
      const match = await tx.opportunityMatch.findFirst({
        where: { id: matchId, userId },
        include: { listing: true },
      });
      if (!match) throw new ApplicationError("Opportunité introuvable");
      if (
        match.status === OpportunityMatchStatus.CONVERTED ||
        match.missionId
      ) {
        throw new ApplicationError(
          "Cette opportunité est déjà dans le pipeline",
        );
      }
      if (match.listing.expiresAt && match.listing.expiresAt < new Date()) {
        throw new ApplicationError("Cette opportunité a expiré");
      }

      // Claim the match inside the transaction before creating a Mission.
      // This makes concurrent conversions deterministic even before the
      // serializable transaction conflict detector runs.
      const claim = await tx.opportunityMatch.updateMany({
        where: {
          id: match.id,
          userId,
          missionId: null,
          status: { not: OpportunityMatchStatus.CONVERTED },
        },
        data: {
          status: OpportunityMatchStatus.CONVERTED,
          convertedAt: new Date(),
        },
      });
      if (claim.count !== 1) {
        throw new ApplicationError(
          "Cette opportunité est déjà dans le pipeline",
        );
      }

      const profile = await tx.userProfile.findFirst({
        where: { userId },
        orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
        select: { id: true },
      });
      const mission = await tx.mission.create({
        data: {
          userId,
          profileId: profile?.id,
          title: match.listing.title,
          company: match.listing.company,
          description: match.listing.description,
          tjm: match.listing.dailyRateMax ?? match.listing.dailyRateMin,
          duration: match.listing.duration,
          workType: match.listing.workType,
          location: match.listing.location,
          stack: match.listing.skills,
          sourceUrl: match.listing.canonicalUrl,
          score: match.score,
          scoreBreakdown: match.breakdown ?? Prisma.JsonNull,
          notes: `Importée depuis Radar Missions (${match.listing.source}). Snapshot conservé le ${new Date().toISOString()}.`,
        },
      });
      await tx.activityEvent.create({
        data: {
          missionId: mission.id,
          userId,
          type: ActivityEventType.MISSION_CREATED,
          description: `Mission « ${mission.title} » créée depuis Radar Missions`,
        },
      });
      await tx.opportunityMatch.update({
        where: { id: match.id },
        data: { missionId: mission.id },
      });
      return mission;
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
