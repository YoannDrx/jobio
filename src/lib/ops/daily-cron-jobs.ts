export const DAILY_CRON_JOBS = [
  { path: "/api/cron/recurring-invoices", method: "GET" },
  { path: "/api/cron/billing-reminders", method: "GET" },
  { path: "/api/cron/push-notifications", method: "GET" },
  { path: "/api/cron/analytics-snapshot", method: "POST" },
  { path: "/api/cron/trial-ending", method: "GET" },
  { path: "/api/cron/trial-reminders", method: "GET" },
  { path: "/api/cron/seo-search-metrics-sync", method: "POST" },
  { path: "/api/cron/opportunity-sync", method: "GET" },
] as const;
