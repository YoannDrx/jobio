import { isSeoSyncJobName } from "./seo-sync-jobs";

export type CronRunLite = {
  jobName: string;
  status: "RUNNING" | "SUCCESS" | "FAILED" | "UNAUTHORIZED";
  startedAt: Date;
};

export type SeoSyncFreshness = {
  status: "fresh" | "stale" | "missing";
  ageHours: number | null;
};

const SEO_SYNC_STALE_AFTER_HOURS = 48;

export const isSeoSyncRun = (run: CronRunLite): boolean =>
  isSeoSyncJobName(run.jobName);

export const getLatestSeoSyncRun = (
  runs: CronRunLite[],
): CronRunLite | null => {
  const seoRuns = runs.filter(isSeoSyncRun);

  if (seoRuns.length === 0) {
    return null;
  }

  return seoRuns.reduce((latest, current) =>
    current.startedAt > latest.startedAt ? current : latest,
  );
};

export const getLatestSeoSyncSuccessRun = (
  runs: CronRunLite[],
): CronRunLite | null => {
  const successfulRuns = runs.filter(
    (run) => isSeoSyncRun(run) && run.status === "SUCCESS",
  );

  if (successfulRuns.length === 0) {
    return null;
  }

  return successfulRuns.reduce((latest, current) =>
    current.startedAt > latest.startedAt ? current : latest,
  );
};

export const computeSeoSyncFreshness = (
  lastSuccessfulSyncAt: Date | null,
  now: Date = new Date(),
): SeoSyncFreshness => {
  if (!lastSuccessfulSyncAt) {
    return {
      status: "missing",
      ageHours: null,
    };
  }

  const ageHours = Math.max(
    0,
    Math.floor((now.getTime() - lastSuccessfulSyncAt.getTime()) / 3_600_000),
  );

  return {
    status: ageHours > SEO_SYNC_STALE_AFTER_HOURS ? "stale" : "fresh",
    ageHours,
  };
};

export const formatSyncAge = (ageHours: number | null): string => {
  if (ageHours === null) {
    return "-";
  }

  if (ageHours < 24) {
    return `${ageHours}h`;
  }

  return `${Math.floor(ageHours / 24)}j`;
};
