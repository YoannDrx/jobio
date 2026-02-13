import { prisma } from "@/lib/prisma";
import { STALE_ELIGIBLE_STATUS_VALUES } from "@/features/missions/mission-status";
import { calculateProfileCompleteness } from "@/features/profiles/profile-completeness";

export type InsightType =
  | "OVERDUE_FOLLOWUPS"
  | "STALE_PIPELINE"
  | "INCOMPLETE_PROFILE"
  | "CONVERSION_DROP"
  | "UNPRODUCTIVE_PLATFORM";

export type InsightSeverity = "info" | "warning" | "critical";

export type Insight = {
  type: InsightType;
  severity: InsightSeverity;
  message: string;
  link?: string;
  count?: number;
};

const STALE_DAYS = 14;

export async function calculateInsights(userId: string): Promise<Insight[]> {
  const insights: Insight[] = [];

  const [overdueFollowUps, staleMissions, defaultProfile, missions, platforms] =
    await Promise.all([
      prisma.followUp.count({
        where: {
          userId,
          completedAt: null,
          scheduledAt: { lt: new Date() },
        },
      }),
      prisma.mission.count({
        where: {
          userId,
          deletedAt: null,
          status: { in: [...STALE_ELIGIBLE_STATUS_VALUES] },
          updatedAt: {
            lt: new Date(Date.now() - STALE_DAYS * 24 * 60 * 60 * 1000),
          },
        },
      }),
      prisma.userProfile
        .findFirst({
          where: { userId, isDefault: true },
        })
        .then(
          async (p) =>
            p ??
            prisma.userProfile.findFirst({
              where: { userId },
              orderBy: { createdAt: "asc" },
            }),
        ),
      prisma.mission.findMany({
        where: { userId, deletedAt: null },
        select: { status: true, platformId: true },
      }),
      prisma.userPlatform.findMany({
        where: { userId },
        include: { platform: { select: { name: true } } },
      }),
    ]);

  // 1. Overdue follow-ups
  if (overdueFollowUps > 0) {
    insights.push({
      type: "OVERDUE_FOLLOWUPS",
      severity: overdueFollowUps >= 5 ? "critical" : "warning",
      message: `${overdueFollowUps} relance${overdueFollowUps > 1 ? "s" : ""} en retard. Planifiez vos suivis pour ne pas perdre d'opportunites.`,
      link: "/app/today",
      count: overdueFollowUps,
    });
  }

  // 2. Stale pipeline
  if (staleMissions > 0) {
    insights.push({
      type: "STALE_PIPELINE",
      severity: staleMissions >= 5 ? "warning" : "info",
      message: `${staleMissions} mission${staleMissions > 1 ? "s" : ""} sans mise a jour depuis ${STALE_DAYS} jours. Pensez a les relancer ou les archiver.`,
      link: "/app/missions",
      count: staleMissions,
    });
  }

  // 3. Incomplete profile
  if (defaultProfile) {
    const { score } = calculateProfileCompleteness(defaultProfile);
    if (score < 80) {
      insights.push({
        type: "INCOMPLETE_PROFILE",
        severity: score < 50 ? "warning" : "info",
        message: `Votre profil est complete a ${score}%. Un profil complet augmente vos chances d'etre selectionne.`,
        link: "/app/profiles",
      });
    }
  } else {
    insights.push({
      type: "INCOMPLETE_PROFILE",
      severity: "warning",
      message:
        "Aucun profil cree. Creez votre premier profil pour commencer a postuler.",
      link: "/app/profiles",
    });
  }

  // 4. Conversion drop
  const refused = missions.filter((m) => m.status === "REFUSE").length;
  const total = missions.length;

  if (total >= 5 && refused > 0) {
    const refusalRate = Math.round((refused / total) * 100);
    if (refusalRate >= 50) {
      insights.push({
        type: "CONVERSION_DROP",
        severity: "critical",
        message: `Taux de refus eleve (${refusalRate}%). Analysez vos candidatures pour identifier les axes d'amelioration.`,
        link: "/app/analytics",
      });
    } else if (refusalRate >= 30) {
      insights.push({
        type: "CONVERSION_DROP",
        severity: "warning",
        message: `${refusalRate}% de vos missions se terminent par un refus. Consultez vos statistiques pour comprendre pourquoi.`,
        link: "/app/analytics",
      });
    }
  }

  // 5. Unproductive platforms
  if (platforms.length > 0 && total >= 3) {
    const missionsByPlatform = new Map<
      string,
      { total: number; won: number }
    >();

    for (const mission of missions) {
      if (!mission.platformId) continue;
      const current = missionsByPlatform.get(mission.platformId) ?? {
        total: 0,
        won: 0,
      };
      current.total++;
      if (mission.status === "ACCEPTE") current.won++;
      missionsByPlatform.set(mission.platformId, current);
    }

    for (const up of platforms) {
      const stats = missionsByPlatform.get(up.platformId);
      if (stats && stats.total >= 3 && stats.won === 0) {
        insights.push({
          type: "UNPRODUCTIVE_PLATFORM",
          severity: "info",
          message: `Aucune mission gagnee sur ${up.platform.name} (${stats.total} candidatures). Evaluez votre strategie sur cette plateforme.`,
          link: "/app/analytics",
        });
      }
    }
  }

  // Tri par severite
  const severityOrder: Record<InsightSeverity, number> = {
    critical: 0,
    warning: 1,
    info: 2,
  };

  insights.sort(
    (a, b) => severityOrder[a.severity] - severityOrder[b.severity],
  );

  return insights;
}
