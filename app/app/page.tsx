import {
  Layout,
  LayoutContent,
  LayoutHeader,
  LayoutTitle,
  LayoutDescription,
} from "@/features/page/layout";
import { getRequiredUser } from "@/lib/auth/auth-user";
import { prisma } from "@/lib/prisma";
import { TodayContent } from "@/features/missions/components/today/today-content";
import type { Suggestion } from "@/features/missions/components/today/today-suggestions";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { getOnboardingStatusAction } from "@/features/onboarding/onboarding.action";
import {
  FOLLOW_UP_RECOMMENDED_STATUS_VALUES,
  PIPELINE_STATUS_VALUES,
  STALE_ELIGIBLE_STATUS_VALUES,
  type MissionStatusValue,
} from "@/features/missions/mission-status";

export default async function TodayPage() {
  const user = await getRequiredUser();

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999,
  );

  // Calculate week boundaries (Monday to Sunday)
  const dayOfWeek = now.getDay();
  const diffToMonday = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  const startOfWeek = new Date(now.getFullYear(), now.getMonth(), diffToMonday);
  const endOfWeek = new Date(
    now.getFullYear(),
    now.getMonth(),
    diffToMonday + 6,
    23,
    59,
    59,
    999,
  );

  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfPrevMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    0,
    23,
    59,
    59,
    999,
  );

  const [
    recentMissions,
    statusCounts,
    overdueFollowUps,
    todayFollowUps,
    staleMissions,
    missionsAddedThisWeek,
    followUpsCompletedThisWeek,
    missionsWithoutRecentFollowUp,
    highScoreMissions,
    missionsWithoutContactCount,
    tjmThisMonth,
    tjmPrevMonth,
  ] = await Promise.all([
    prisma.mission.findMany({
      where: {
        userId: user.id,
        deletedAt: null,
        status: { in: [...PIPELINE_STATUS_VALUES] },
      },
      select: {
        id: true,
        title: true,
        company: true,
        status: true,
        score: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.mission.groupBy({
      by: ["status"],
      where: {
        userId: user.id,
        deletedAt: null,
        status: { in: [...PIPELINE_STATUS_VALUES] },
      },
      _count: true,
    }),
    prisma.followUp.findMany({
      where: {
        userId: user.id,
        scheduledAt: { lt: now },
        completedAt: null,
      },
      include: {
        mission: {
          select: {
            id: true,
            title: true,
            company: true,
            status: true,
          },
        },
      },
      orderBy: { scheduledAt: "asc" },
    }),
    prisma.followUp.findMany({
      where: {
        userId: user.id,
        scheduledAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
        completedAt: null,
      },
      include: {
        mission: {
          select: {
            id: true,
            title: true,
            company: true,
            status: true,
          },
        },
      },
      orderBy: { scheduledAt: "asc" },
    }),
    prisma.mission.findMany({
      where: {
        userId: user.id,
        status: { in: [...STALE_ELIGIBLE_STATUS_VALUES] },
        updatedAt: { lt: twoWeeksAgo },
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
        company: true,
        status: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "asc" },
    }),
    prisma.mission.count({
      where: {
        userId: user.id,
        createdAt: {
          gte: startOfWeek,
          lte: endOfWeek,
        },
        deletedAt: null,
      },
    }),
    prisma.followUp.count({
      where: {
        userId: user.id,
        completedAt: {
          gte: startOfWeek,
          lte: endOfWeek,
        },
      },
    }),
    // Missions POSTULE/ENTRETIEN without recent follow-up (> 7 days)
    prisma.mission.findMany({
      where: {
        userId: user.id,
        status: { in: [...FOLLOW_UP_RECOMMENDED_STATUS_VALUES] },
        deletedAt: null,
        followUps: {
          none: {
            scheduledAt: { gte: sevenDaysAgo },
          },
        },
      },
      select: {
        id: true,
        title: true,
        company: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "asc" },
      take: 3,
    }),
    // Missions A_POSTULER with high score
    prisma.mission.findMany({
      where: {
        userId: user.id,
        status: "A_POSTULER",
        score: { gt: 75 },
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
        score: true,
      },
      orderBy: { score: "desc" },
      take: 3,
    }),
    // Missions without contact
    prisma.mission.count({
      where: {
        userId: user.id,
        contactId: null,
        status: { in: [...STALE_ELIGIBLE_STATUS_VALUES] },
        deletedAt: null,
      },
    }),
    // Average TJM this month
    prisma.mission.aggregate({
      where: {
        userId: user.id,
        tjm: { not: null },
        createdAt: { gte: startOfMonth },
        deletedAt: null,
      },
      _avg: { tjm: true },
    }),
    // Average TJM previous month
    prisma.mission.aggregate({
      where: {
        userId: user.id,
        tjm: { not: null },
        createdAt: { gte: startOfPrevMonth, lte: endOfPrevMonth },
        deletedAt: null,
      },
      _avg: { tjm: true },
    }),
  ]);

  const onboardingStatus = await resolveActionResult(
    getOnboardingStatusAction(),
  );
  const isOnboardingComplete = onboardingStatus.isComplete;

  const counters = Object.fromEntries(
    statusCounts.map((s) => [s.status, s._count]),
  );
  const totalMissions = PIPELINE_STATUS_VALUES.reduce(
    (acc, status) => acc + (counters[status] ?? 0),
    0,
  );

  // Build suggestions (max 3)
  const suggestions: Suggestion[] = [];

  for (const m of missionsWithoutRecentFollowUp) {
    if (suggestions.length >= 3) break;
    const daysSinceUpdate = Math.floor(
      (now.getTime() - m.updatedAt.getTime()) / (1000 * 60 * 60 * 24),
    );
    suggestions.push({
      id: `no-followup-${m.id}`,
      type: "no_followup",
      message: `Tu n'as pas relance ${m.company ?? m.title} depuis ${daysSinceUpdate} jours`,
      link: "/app/pipeline",
    });
  }

  for (const m of highScoreMissions) {
    if (suggestions.length >= 3) break;
    suggestions.push({
      id: `high-score-${m.id}`,
      type: "high_score",
      message: `Mission "${m.title}" a un super score (${m.score}), postule !`,
      link: "/app/pipeline",
    });
  }

  if (suggestions.length < 3 && missionsWithoutContactCount > 0) {
    suggestions.push({
      id: "no-contact",
      type: "no_contact",
      message: `${missionsWithoutContactCount} mission${missionsWithoutContactCount > 1 ? "s" : ""} n'${missionsWithoutContactCount > 1 ? "ont" : "a"} pas de contact associe`,
      link: "/app/contacts",
    });
  }

  const avgTjmThisMonth = tjmThisMonth._avg.tjm;
  const avgTjmPrevMonth = tjmPrevMonth._avg.tjm;
  if (
    suggestions.length < 3 &&
    avgTjmThisMonth !== null &&
    avgTjmPrevMonth !== null &&
    avgTjmThisMonth > avgTjmPrevMonth
  ) {
    suggestions.push({
      id: "tjm-trend",
      type: "tjm_trend",
      message: `Ton TJM moyen est en hausse ce mois-ci (${Math.round(avgTjmThisMonth)}€ vs ${Math.round(avgTjmPrevMonth)}€ le mois dernier)`,
    });
  }

  const hour = now.getHours();
  const greeting =
    hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";

  const formattedDate = now.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <Layout size="lg">
      <LayoutHeader>
        <LayoutTitle>
          {greeting} {user.name.split(" ")[0]}
        </LayoutTitle>
        <LayoutDescription className="capitalize">
          {formattedDate}
        </LayoutDescription>
      </LayoutHeader>
      <LayoutContent>
        <TodayContent
          recentMissions={recentMissions.map((m) => ({
            id: m.id,
            title: m.title,
            company: m.company,
            status: m.status as MissionStatusValue,
            score: m.score,
            createdAt: m.createdAt.toISOString(),
          }))}
          counters={counters}
          totalMissions={totalMissions}
          overdueFollowUps={overdueFollowUps.map((f) => ({
            id: f.id,
            title: f.title,
            type: f.type,
            scheduledAt: f.scheduledAt.toISOString(),
            mission: {
              id: f.mission.id,
              title: f.mission.title,
              company: f.mission.company,
              status: f.mission.status,
            },
          }))}
          todayFollowUps={todayFollowUps.map((f) => ({
            id: f.id,
            title: f.title,
            type: f.type,
            scheduledAt: f.scheduledAt.toISOString(),
            mission: {
              id: f.mission.id,
              title: f.mission.title,
              company: f.mission.company,
              status: f.mission.status,
            },
          }))}
          staleMissions={staleMissions.map((m) => ({
            id: m.id,
            title: m.title,
            company: m.company,
            status: m.status,
            updatedAt: m.updatedAt.toISOString(),
          }))}
          weekStats={{
            missionsAdded: missionsAddedThisWeek,
            followUpsCompleted: followUpsCompletedThisWeek,
          }}
          suggestions={suggestions}
          batchFollowUpCandidates={missionsWithoutRecentFollowUp.map((mission) => ({
            id: mission.id,
            title: mission.title,
            company: mission.company,
            daysWithoutFollowUp: Math.max(
              1,
              Math.floor(
                (now.getTime() - mission.updatedAt.getTime()) /
                  (1000 * 60 * 60 * 24),
              ),
            ),
          }))}
          onboardingStatus={
            isOnboardingComplete
              ? null
              : {
                  hasProfile: onboardingStatus.hasProfile,
                  hasPlatforms: onboardingStatus.hasPlatforms,
                  hasMission: onboardingStatus.hasMission,
                  hasSequence: onboardingStatus.hasSequence,
                  hasContact: onboardingStatus.hasContact,
                  hasFollowUp: onboardingStatus.hasFollowUp,
                  hasSentEmail: onboardingStatus.hasSentEmail,
                  completedSteps: onboardingStatus.completedSteps,
                  totalSteps: onboardingStatus.totalSteps,
                  extendedChecklistEnabled:
                    onboardingStatus.extendedChecklistEnabled,
                  isDismissed: onboardingStatus.isDismissed,
                }
          }
        />
      </LayoutContent>
    </Layout>
  );
}
