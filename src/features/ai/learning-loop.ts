import { prisma } from "@/lib/prisma";

type Recommendation = {
  type:
    | "PLATFORM_PERF"
    | "TEMPLATE_PERF"
    | "BEST_TIME"
    | "SKILL_GAP"
    | "APPROACH_STYLE";
  title: string;
  description: string;
  score: number;
  data?: Record<string, unknown>;
};

export async function computeRecommendations(
  userId: string,
): Promise<Recommendation[]> {
  const recommendations: Recommendation[] = [];

  const [missions, templateUsages, defaultProfile] = await Promise.all([
    prisma.mission.findMany({
      where: { userId, deletedAt: null },
      select: {
        id: true,
        status: true,
        platformId: true,
        workType: true,
        stack: true,
        createdAt: true,
        platform: { select: { name: true } },
      },
    }),
    prisma.messageTemplateUsage.findMany({
      where: { userId, mission: { isNot: null } },
      include: {
        template: { select: { id: true, name: true } },
        mission: { select: { status: true } },
      },
    }),
    prisma.userProfile.findFirst({
      where: { userId, isDefault: true },
      select: { skills: true },
    }),
  ]);

  const totalMissions = missions.length;
  if (totalMissions < 3) return recommendations;

  const refused = missions.filter((m) => m.status === "REFUSE");

  // a. PLATFORM_PERF
  const platformStats = new Map<
    string,
    { name: string; total: number; won: number }
  >();
  for (const m of missions) {
    if (!m.platformId || !m.platform) continue;
    const current = platformStats.get(m.platformId) ?? {
      name: m.platform.name,
      total: 0,
      won: 0,
    };
    current.total++;
    if (m.status === "ACCEPTE") current.won++;
    platformStats.set(m.platformId, current);
  }

  const platformEntries = [...platformStats.entries()]
    .filter(([, s]) => s.total >= 2)
    .sort((a, b) => b[1].won / b[1].total - a[1].won / a[1].total);

  if (platformEntries.length > 0) {
    const best = platformEntries[0][1];
    const conversionRate = Math.round((best.won / best.total) * 100);
    if (conversionRate > 0) {
      recommendations.push({
        type: "PLATFORM_PERF",
        title: `${best.name} est votre meilleure plateforme`,
        description: `Taux de conversion de ${conversionRate}% sur ${best.name} (${best.won}/${best.total} missions). Concentrez vos efforts ici.`,
        score: Math.min(conversionRate, 100),
        data: {
          platformName: best.name,
          conversionRate,
          won: best.won,
          total: best.total,
        },
      });
    }
  }

  // b. TEMPLATE_PERF
  const templateWins = new Map<
    string,
    { name: string; wins: number; total: number }
  >();
  for (const usage of templateUsages) {
    if (!usage.mission) continue;
    const current = templateWins.get(usage.templateId) ?? {
      name: usage.template.name,
      wins: 0,
      total: 0,
    };
    current.total++;
    if (usage.mission.status === "ACCEPTE") current.wins++;
    templateWins.set(usage.templateId, current);
  }

  const sortedTemplates = [...templateWins.entries()]
    .filter(([, s]) => s.total >= 2)
    .sort((a, b) => b[1].wins / b[1].total - a[1].wins / a[1].total);

  if (sortedTemplates.length > 0) {
    const [, stats] = sortedTemplates[0];
    const rate = Math.round((stats.wins / stats.total) * 100);
    if (rate > 0) {
      recommendations.push({
        type: "TEMPLATE_PERF",
        title: `Le template "${stats.name}" performe bien`,
        description: `${rate}% de reussite quand vous utilisez "${stats.name}" (${stats.wins}/${stats.total}). Reutilisez-le en priorite.`,
        score: Math.min(rate, 100),
        data: { templateName: stats.name, rate, wins: stats.wins },
      });
    }
  }

  // c. BEST_TIME
  const dayStats = new Map<number, { total: number; won: number }>();
  for (const m of missions) {
    const day = m.createdAt.getDay();
    const current = dayStats.get(day) ?? { total: 0, won: 0 };
    current.total++;
    if (m.status === "ACCEPTE") current.won++;
    dayStats.set(day, current);
  }

  const dayNames = [
    "Dimanche",
    "Lundi",
    "Mardi",
    "Mercredi",
    "Jeudi",
    "Vendredi",
    "Samedi",
  ];
  const sortedDays = [...dayStats.entries()]
    .filter(([, s]) => s.total >= 2 && s.won > 0)
    .sort((a, b) => b[1].won / b[1].total - a[1].won / a[1].total);

  if (sortedDays.length > 0) {
    const [day, stats] = sortedDays[0];
    const rate = Math.round((stats.won / stats.total) * 100);
    recommendations.push({
      type: "BEST_TIME",
      title: `Le ${dayNames[day]} est votre meilleur jour`,
      description: `${rate}% de missions acceptees quand vous postulez le ${dayNames[day]} (${stats.won}/${stats.total}). Privilegiez ce jour.`,
      score: Math.min(rate, 100),
      data: { day: dayNames[day], rate, won: stats.won, total: stats.total },
    });
  }

  // d. SKILL_GAP
  const profileSkills = new Set<string>();
  if (defaultProfile?.skills) {
    const skills = defaultProfile.skills as { name: string }[];
    for (const s of skills) {
      profileSkills.add(s.name.toLowerCase());
    }
  }

  const missingSkillsCount = new Map<string, number>();
  for (const m of refused) {
    for (const skill of m.stack) {
      const lower = skill.toLowerCase();
      if (!profileSkills.has(lower)) {
        missingSkillsCount.set(skill, (missingSkillsCount.get(skill) ?? 0) + 1);
      }
    }
  }

  const topMissingSkills = [...missingSkillsCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  if (topMissingSkills.length > 0) {
    const skillNames = topMissingSkills.map(([name]) => name).join(", ");
    const totalGaps = topMissingSkills.reduce(
      (sum, [, count]) => sum + count,
      0,
    );
    const score = Math.min(Math.round((totalGaps / refused.length) * 100), 100);
    recommendations.push({
      type: "SKILL_GAP",
      title: "Competences manquantes detectees",
      description: `Les missions refusees mentionnent souvent : ${skillNames}. Ajouter ces competences pourrait ameliorer vos chances.`,
      score,
      data: {
        missingSkills: topMissingSkills.map(([name, count]) => ({
          name,
          count,
        })),
      },
    });
  }

  // e. APPROACH_STYLE
  const workTypeStats = new Map<string, { total: number; won: number }>();
  for (const m of missions) {
    if (!m.workType) continue;
    const current = workTypeStats.get(m.workType) ?? { total: 0, won: 0 };
    current.total++;
    if (m.status === "ACCEPTE") current.won++;
    workTypeStats.set(m.workType, current);
  }

  const workTypeEntries = [...workTypeStats.entries()]
    .filter(([, s]) => s.total >= 2)
    .sort((a, b) => b[1].won / b[1].total - a[1].won / a[1].total);

  if (workTypeEntries.length > 0) {
    const [bestType, stats] = workTypeEntries[0];
    const rate = Math.round((stats.won / stats.total) * 100);
    if (rate > 0) {
      const labels: Record<string, string> = {
        REMOTE: "Remote",
        ONSITE: "Sur site",
        HYBRID: "Hybride",
      };
      recommendations.push({
        type: "APPROACH_STYLE",
        title: `Le ${labels[bestType] ?? bestType} vous reussit mieux`,
        description: `${rate}% de reussite en ${labels[bestType] ?? bestType} (${stats.won}/${stats.total}). Privilegiez ce mode de travail.`,
        score: Math.min(rate, 100),
        data: { workType: bestType, rate, won: stats.won, total: stats.total },
      });
    }
  }

  recommendations.sort((a, b) => b.score - a.score);

  return recommendations;
}
