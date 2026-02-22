export const SEO_SYNC_JOB_NAMES = [
  "seo-search-metrics-sync",
  "seo-search-metrics-sync-manual",
] as const;

export type SeoSyncJobName = (typeof SEO_SYNC_JOB_NAMES)[number];

const SEO_SYNC_JOB_SET = new Set<string>(SEO_SYNC_JOB_NAMES);

export const isSeoSyncJobName = (jobName: string): boolean =>
  SEO_SYNC_JOB_SET.has(jobName);
