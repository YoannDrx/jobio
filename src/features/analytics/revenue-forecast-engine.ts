import { prisma } from "@/lib/prisma";
import { parseDurationToDays } from "./actions/shared";

const STATUS_PROBABILITIES: Record<string, number> = {
  A_POSTULER: 0.05,
  POSTULE: 0.15,
  ENTRETIEN: 0.4,
  PROPOSITION: 0.7,
  ACCEPTE: 0.95,
  REFUSE: 0,
  EN_PAUSE: 0.05,
  ABANDONNE: 0,
  ARCHIVE: 0,
};

type ForecastByStatus = {
  status: string;
  count: number;
  totalValue: number;
  weightedValue: number;
  probability: number;
};

type ForecastResult = {
  forecast30: number;
  forecast60: number;
  forecast90: number;
  byStatus: ForecastByStatus[];
  totalWeighted: number;
  confidence: number;
};

export async function computeRevenueForecast(
  userId: string,
): Promise<ForecastResult> {
  const activeMissions = await prisma.mission.findMany({
    where: {
      userId,
      deletedAt: null,
      status: {
        notIn: ["REFUSE", "ABANDONNE", "ARCHIVE"],
      },
      tjm: { not: null },
    },
    select: {
      status: true,
      tjm: true,
      duration: true,
      createdAt: true,
    },
  });

  const byStatusMap = new Map<string, ForecastByStatus>();
  let totalWeighted = 0;

  for (const mission of activeMissions) {
    const tjm = mission.tjm ?? 0;
    const days = parseDurationToDays(mission.duration);
    const value = tjm * days;
    const probability = STATUS_PROBABILITIES[mission.status] ?? 0;
    const weighted = value * probability;

    const existing = byStatusMap.get(mission.status) ?? {
      status: mission.status,
      count: 0,
      totalValue: 0,
      weightedValue: 0,
      probability: Math.round(probability * 100),
    };

    existing.count += 1;
    existing.totalValue += value;
    existing.weightedValue += weighted;
    byStatusMap.set(mission.status, existing);

    totalWeighted += weighted;
  }

  const now = new Date();
  const threeMonthsAgo = new Date(now);
  threeMonthsAgo.setDate(threeMonthsAgo.getDate() - 90);

  const recentAccepted = await prisma.mission.count({
    where: {
      userId,
      deletedAt: null,
      status: "ACCEPTE",
      updatedAt: { gte: threeMonthsAgo },
    },
  });

  const monthlyVelocity = recentAccepted / 3;

  const avgAcceptedValue = await getAverageAcceptedValue(userId);

  const forecast30 = Math.round(
    totalWeighted * 0.33 + monthlyVelocity * avgAcceptedValue,
  );
  const forecast60 = Math.round(
    totalWeighted * 0.6 + monthlyVelocity * 2 * avgAcceptedValue,
  );
  const forecast90 = Math.round(
    totalWeighted * 0.85 + monthlyVelocity * 3 * avgAcceptedValue,
  );

  const totalMissions = activeMissions.length;
  const confidence = computeConfidence(totalMissions, recentAccepted);

  const byStatus = Array.from(byStatusMap.values()).map((s) => ({
    ...s,
    totalValue: Math.round(s.totalValue),
    weightedValue: Math.round(s.weightedValue),
  }));

  return {
    forecast30,
    forecast60,
    forecast90,
    byStatus,
    totalWeighted: Math.round(totalWeighted),
    confidence,
  };
}

async function getAverageAcceptedValue(userId: string): Promise<number> {
  const accepted = await prisma.mission.findMany({
    where: {
      userId,
      deletedAt: null,
      status: "ACCEPTE",
      tjm: { not: null },
    },
    select: { tjm: true, duration: true },
    take: 20,
    orderBy: { updatedAt: "desc" },
  });

  if (accepted.length === 0) return 0;

  const total = accepted.reduce((sum, m) => {
    return sum + (m.tjm ?? 0) * parseDurationToDays(m.duration);
  }, 0);

  return total / accepted.length;
}

function computeConfidence(
  totalMissions: number,
  recentAccepted: number,
): number {
  if (totalMissions === 0) return 0;

  let score = 0;

  if (totalMissions >= 10) score += 30;
  else if (totalMissions >= 5) score += 20;
  else score += 10;

  if (recentAccepted >= 3) score += 40;
  else if (recentAccepted >= 1) score += 25;
  else score += 5;

  score += Math.min(30, totalMissions * 3);

  return Math.min(100, score);
}
