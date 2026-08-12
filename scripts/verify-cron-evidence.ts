/* eslint-disable no-console */
import { prisma } from "@/lib/prisma";

const REQUIRED_CONSECUTIVE_DAYS = 7;
const MAX_LATEST_RUN_AGE_HOURS = 36;

const utcDay = (date: Date) => date.toISOString().slice(0, 10);

const previousUtcDay = (day: string) => {
  const date = new Date(`${day}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return utcDay(date);
};

const main = async () => {
  const since = new Date(Date.now() - 21 * 24 * 60 * 60 * 1000);
  const runs = await prisma.cronJobRun.findMany({
    where: {
      jobName: "daily-orchestrator",
      startedAt: { gte: since },
    },
    orderBy: { startedAt: "desc" },
    select: { status: true, startedAt: true, finishedAt: true },
  });

  const latestByDay = new Map<string, (typeof runs)[number]>();
  for (const run of runs) {
    const day = utcDay(run.startedAt);
    if (!latestByDay.has(day)) latestByDay.set(day, run);
  }
  const days = [...latestByDay.keys()].sort().reverse();
  const newestDay = days[0];
  const failures: string[] = [];

  if (!newestDay) {
    failures.push("aucun run daily-orchestrator enregistré sur 21 jours");
  } else {
    const newestRun = latestByDay.get(newestDay);
    const newestAgeHours =
      (Date.now() -
        (newestRun?.finishedAt ?? newestRun?.startedAt ?? since).getTime()) /
      3_600_000;
    if (newestAgeHours > MAX_LATEST_RUN_AGE_HOURS) {
      failures.push(
        `dernier run trop ancien (${newestAgeHours.toFixed(1)} h, maximum ${MAX_LATEST_RUN_AGE_HOURS} h)`,
      );
    }

    let expectedDay = newestDay;
    for (let index = 0; index < REQUIRED_CONSECUTIVE_DAYS; index += 1) {
      const run = latestByDay.get(expectedDay);
      if (!run) failures.push(`run manquant le ${expectedDay} UTC`);
      else if (run.status !== "SUCCESS") {
        failures.push(`dernier run du ${expectedDay} = ${run.status}`);
      }
      expectedDay = previousUtcDay(expectedDay);
    }
  }

  if (failures.length > 0) {
    for (const failure of failures) console.error(`[ERREUR] ${failure}`);
    console.error(
      `[NO-GO] Preuve cron: ${REQUIRED_CONSECUTIVE_DAYS} jours consécutifs non démontrés.`,
    );
    process.exitCode = 1;
  } else {
    console.log(
      `[OK] ${REQUIRED_CONSECUTIVE_DAYS} derniers jours UTC: daily-orchestrator SUCCESS et preuve fraîche.`,
    );
  }
};

void main().finally(async () => prisma.$disconnect());
