import type { BlogPost } from "@/features/blog/blog-data";
import type {
  SeoSearchMetricsState,
  SeoSearchSnapshot,
} from "@/features/admin/seo-search-metrics";
import { SiteConfig } from "@/site-config";
import type { MetadataRoute } from "next";

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const SEARCH_METRICS_STALE_AFTER_DAYS = 8;
const LOW_CTR_REFRESH_THRESHOLD = 0.02;
const LOW_CTR_MIN_IMPRESSIONS = 200;
const FOLLOW_UP_DUE_WINDOW_DAYS = 7;
const CONTENT_REFRESH_TRACKER = [
  {
    path: "/blog/structurer-prospection-freelance-2026",
    refreshedAt: "2026-02-22",
  },
  {
    path: "/blog/crm-freelance-criteres-stack-minimale",
    refreshedAt: "2026-02-22",
  },
  {
    path: "/blog/5-conseils-prospection-freelance",
    refreshedAt: "2026-02-22",
  },
  {
    path: "/blog/optimiser-profil-linkedin-freelance",
    refreshedAt: "2026-02-22",
  },
] as const;

export const REQUIRED_PUBLIC_PAGES = [
  "/",
  "/about",
  "/features",
  "/blog",
  "/docs",
  "/contact",
  "/branding",
  "/legal/terms",
  "/legal/privacy",
  "/rss.xml",
] as const;

export const EXPECTED_PRIVATE_DISALLOWS = [
  "/admin",
  "/api",
  "/app",
  "/auth",
  "/job",
  "/freelance",
  "/account",
  "/payment/success",
  "/payment/cancel",
] as const;

type SeoChecklistStatus = "ok" | "warning";

export type SeoChecklistItem = {
  id: string;
  label: string;
  status: SeoChecklistStatus;
  detail: string;
};

export type SeoTopQuerySummary = {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number | null;
};

export type SeoContentRefreshCandidate = {
  path: string;
  clicks: number;
  impressions: number;
  ctr: number;
  reason: string;
};

export type SeoContentRefreshFollowUp = {
  path: string;
  refreshedAt: string;
  ageDays: number;
  milestone: "J+14" | "J+30" | "J+60";
  status: "waiting" | "due" | "overdue";
  clicks: number | null;
  impressions: number | null;
  ctr: number | null;
  detail: string;
};

export type SeoSearchPerformanceSummary = {
  status: SeoSearchMetricsState["status"];
  source: SeoSearchMetricsState["source"];
  provider: SeoSearchSnapshot["provider"] | null;
  periodLabel: string | null;
  capturedAt: string | null;
  snapshotAgeDays: number | null;
  isSnapshotStale: boolean;
  error: string | null;
  clicks: number | null;
  impressions: number | null;
  ctr: number | null;
  averagePosition: number | null;
  clicksDeltaPercent: number | null;
  impressionsDeltaPercent: number | null;
  ctrDeltaPoints: number | null;
  indexedPublicPages: number | null;
  indexedPrivatePages: number | null;
  topQueries: SeoTopQuerySummary[];
  contentRefreshCandidates: SeoContentRefreshCandidate[];
  refreshFollowUps: SeoContentRefreshFollowUp[];
};

export type SeoKpiSummary = {
  sitemapPublicUrlsCount: number;
  hasRssInSitemap: boolean;
  missingRequiredPages: string[];
  blockedPrivateRoutesCount: number;
  missingPrivateDisallows: string[];
  disallowCoveragePercent: number;
  blogPostsLast30Days: number;
  daysSinceLatestBlogPost: number | null;
  checklist: SeoChecklistItem[];
  recommendedActions: string[];
  searchPerformance: SeoSearchPerformanceSummary;
};

const toAbsoluteUrl = (path: `/${string}` | "/") =>
  `${SiteConfig.prodUrl}${path === "/" ? "" : path}`;

const normalizeDisallowPaths = (
  rules: MetadataRoute.Robots["rules"],
): string[] => {
  const rulesList = Array.isArray(rules) ? rules : [rules];
  const paths = new Set<string>();

  for (const rule of rulesList) {
    const disallow = rule.disallow;
    const disallowList = Array.isArray(disallow) ? disallow : [disallow];

    for (const path of disallowList) {
      if (typeof path !== "string") continue;
      const normalized = path.trim();
      if (normalized.length > 0) {
        paths.add(normalized);
      }
    }
  }

  return [...paths];
};

const getLatestPostDate = (posts: BlogPost[]): Date | null => {
  if (posts.length === 0) {
    return null;
  }

  const timestamps = posts
    .map((post) => new Date(post.date).getTime())
    .filter((value) => Number.isFinite(value));

  if (timestamps.length === 0) {
    return null;
  }

  return new Date(Math.max(...timestamps));
};

const roundOneDecimal = (value: number): number =>
  Math.round(value * 10) / 10;

const percentDelta = (current: number, previous: number): number | null => {
  if (previous <= 0) {
    return null;
  }

  return roundOneDecimal(((current - previous) / previous) * 100);
};

const toPeriodLabel = (from: string, to: string, label?: string): string => {
  if (label && label.trim().length > 0) {
    return label;
  }

  return `${from} -> ${to}`;
};

const buildContentRefreshCandidates = (
  snapshot: SeoSearchSnapshot,
): SeoContentRefreshCandidate[] =>
  (snapshot.topPages ?? [])
    .filter((page) => page.path.startsWith("/blog/"))
    .map((page) => {
      if (
        page.impressions >= LOW_CTR_MIN_IMPRESSIONS &&
        page.ctr <= LOW_CTR_REFRESH_THRESHOLD
      ) {
        return {
          path: page.path,
          clicks: page.clicks,
          impressions: page.impressions,
          ctr: roundOneDecimal(page.ctr * 100),
          reason: "CTR faible sur forte impression",
        };
      }

      return null;
    })
    .filter((candidate): candidate is SeoContentRefreshCandidate => candidate !== null)
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 5);

const resolveRefreshMilestone = (
  ageDays: number,
): { milestone: "J+14" | "J+30" | "J+60"; targetDays: number } => {
  if (ageDays < 30) {
    return { milestone: "J+14", targetDays: 14 };
  }

  if (ageDays < 60) {
    return { milestone: "J+30", targetDays: 30 };
  }

  return { milestone: "J+60", targetDays: 60 };
};

const buildRefreshFollowUps = (
  snapshot: SeoSearchSnapshot,
  now: Date,
): SeoContentRefreshFollowUp[] => {
  const topPagesByPath = new Map(
    (snapshot.topPages ?? []).map((page) => [page.path, page] as const),
  );

  return CONTENT_REFRESH_TRACKER.map((trackedPage) => {
    const refreshedAt = new Date(`${trackedPage.refreshedAt}T00:00:00.000Z`);
    const ageDays = Number.isFinite(refreshedAt.getTime())
      ? Math.max(0, Math.floor((now.getTime() - refreshedAt.getTime()) / DAY_IN_MS))
      : 0;
    const { milestone, targetDays } = resolveRefreshMilestone(ageDays);
    const pageMetrics = topPagesByPath.get(trackedPage.path);
    const daysAfterTarget = ageDays - targetDays;
    const status: SeoContentRefreshFollowUp["status"] =
      daysAfterTarget < 0
        ? "waiting"
        : daysAfterTarget <= FOLLOW_UP_DUE_WINDOW_DAYS
          ? "due"
          : "overdue";

    const detail =
      status === "waiting"
        ? `${milestone} à préparer dans ${Math.abs(daysAfterTarget)} jours.`
        : status === "due"
          ? `${milestone} à traiter maintenant (échéance atteinte).`
          : `${milestone} en retard de ${daysAfterTarget - FOLLOW_UP_DUE_WINDOW_DAYS} jours.`;

    return {
      path: trackedPage.path,
      refreshedAt: trackedPage.refreshedAt,
      ageDays,
      milestone,
      status,
      clicks: pageMetrics?.clicks ?? null,
      impressions: pageMetrics?.impressions ?? null,
      ctr: pageMetrics ? roundOneDecimal(pageMetrics.ctr * 100) : null,
      detail,
    };
  }).sort((a, b) => {
    const rank = (value: SeoContentRefreshFollowUp["status"]) => {
      if (value === "overdue") return 0;
      if (value === "due") return 1;
      return 2;
    };
    return rank(a.status) - rank(b.status);
  });
};

const buildSearchPerformanceSummary = (
  searchMetricsState: SeoSearchMetricsState,
  now: Date,
): SeoSearchPerformanceSummary => {
  if (searchMetricsState.status !== "configured" || !searchMetricsState.payload) {
    return {
      status: searchMetricsState.status,
      source: searchMetricsState.source,
      provider: null,
      periodLabel: null,
      capturedAt: null,
      snapshotAgeDays: null,
      isSnapshotStale: false,
      error: searchMetricsState.error,
      clicks: null,
      impressions: null,
      ctr: null,
      averagePosition: null,
      clicksDeltaPercent: null,
      impressionsDeltaPercent: null,
      ctrDeltaPoints: null,
      indexedPublicPages: null,
      indexedPrivatePages: null,
      topQueries: [],
      contentRefreshCandidates: [],
      refreshFollowUps: [],
    };
  }

  const { current, previous } = searchMetricsState.payload;
  const capturedAtDate = new Date(current.capturedAt);
  const snapshotAgeDays = Number.isFinite(capturedAtDate.getTime())
    ? Math.max(
        0,
        Math.floor((now.getTime() - capturedAtDate.getTime()) / DAY_IN_MS),
      )
    : null;
  const isSnapshotStale =
    snapshotAgeDays !== null && snapshotAgeDays >= SEARCH_METRICS_STALE_AFTER_DAYS;

  return {
    status: "configured",
    source: searchMetricsState.source,
    provider: current.provider,
    periodLabel: toPeriodLabel(
      current.period.from,
      current.period.to,
      current.period.label,
    ),
    capturedAt: current.capturedAt,
    snapshotAgeDays,
    isSnapshotStale,
    error: null,
    clicks: current.totals.clicks,
    impressions: current.totals.impressions,
    ctr: roundOneDecimal(current.totals.ctr * 100),
    averagePosition: current.totals.averagePosition ?? null,
    clicksDeltaPercent: previous
      ? percentDelta(current.totals.clicks, previous.totals.clicks)
      : null,
    impressionsDeltaPercent: previous
      ? percentDelta(current.totals.impressions, previous.totals.impressions)
      : null,
    ctrDeltaPoints: previous
      ? roundOneDecimal((current.totals.ctr - previous.totals.ctr) * 100)
      : null,
    indexedPublicPages: current.indexedPages?.public ?? null,
    indexedPrivatePages: current.indexedPages?.private ?? null,
    topQueries: (current.topQueries ?? []).slice(0, 5).map((query) => ({
      query: query.query,
      clicks: query.clicks,
      impressions: query.impressions,
      ctr: roundOneDecimal(query.ctr * 100),
      position: query.position ?? null,
    })),
    contentRefreshCandidates: buildContentRefreshCandidates(current),
    refreshFollowUps: buildRefreshFollowUps(current, now),
  };
};

type ComputeSeoKpiSummaryInput = {
  sitemapEntries: MetadataRoute.Sitemap;
  robotsRules: MetadataRoute.Robots["rules"];
  posts: BlogPost[];
  searchMetricsState: SeoSearchMetricsState;
  now: Date;
};

export const computeSeoKpiSummary = ({
  sitemapEntries,
  robotsRules,
  posts,
  searchMetricsState,
  now,
}: ComputeSeoKpiSummaryInput): SeoKpiSummary => {
  const sitemapUrls = new Set(
    sitemapEntries
      .map((entry) => entry.url)
      .filter((url) => url.startsWith(SiteConfig.prodUrl)),
  );

  const missingRequiredPages = REQUIRED_PUBLIC_PAGES.filter(
    (path) => !sitemapUrls.has(toAbsoluteUrl(path)),
  );

  const disallowPaths = normalizeDisallowPaths(robotsRules);
  const missingPrivateDisallows = EXPECTED_PRIVATE_DISALLOWS.filter(
    (path) => !disallowPaths.includes(path),
  );

  const blockedPrivateRoutesCount =
    EXPECTED_PRIVATE_DISALLOWS.length - missingPrivateDisallows.length;

  const disallowCoveragePercent = Math.round(
    (blockedPrivateRoutesCount / EXPECTED_PRIVATE_DISALLOWS.length) * 100,
  );

  const thirtyDaysAgo = new Date(now.getTime() - 30 * DAY_IN_MS);
  const blogPostsLast30Days = posts.filter((post) => {
    const publishedAt = new Date(post.date);
    return Number.isFinite(publishedAt.getTime()) && publishedAt >= thirtyDaysAgo;
  }).length;

  const latestPostDate = getLatestPostDate(posts);
  const daysSinceLatestBlogPost = latestPostDate
    ? Math.floor((now.getTime() - latestPostDate.getTime()) / DAY_IN_MS)
    : null;

  const hasRssInSitemap = sitemapUrls.has(toAbsoluteUrl("/rss.xml"));

  const searchPerformance = buildSearchPerformanceSummary(searchMetricsState, now);

  const searchMetricsChecklistStatus: SeoChecklistStatus =
    searchPerformance.status !== "configured"
      ? "warning"
      : searchPerformance.indexedPrivatePages !== null &&
          searchPerformance.indexedPrivatePages > 0
        ? "warning"
        : searchPerformance.clicksDeltaPercent !== null &&
            searchPerformance.clicksDeltaPercent <= -30
          ? "warning"
          : searchPerformance.isSnapshotStale
            ? "warning"
          : "ok";

  const searchMetricsChecklistDetail =
    searchPerformance.status === "not_configured"
      ? "Aucune source Search Console/Bing configurée dans l'environnement."
      : searchPerformance.status === "invalid"
        ? `Configuration invalide: ${searchPerformance.error ?? "format non conforme"}.`
        : searchPerformance.indexedPrivatePages !== null &&
            searchPerformance.indexedPrivatePages > 0
          ? `${searchPerformance.indexedPrivatePages} page(s) privée(s) signalée(s) indexée(s) par la source SEO.`
          : searchPerformance.isSnapshotStale &&
              searchPerformance.snapshotAgeDays !== null
            ? `Snapshot SEO obsolète (${searchPerformance.snapshotAgeDays} jours). Rafraîchir la collecte.`
          : searchPerformance.clicks === null || searchPerformance.impressions === null
            ? "Source SEO configurée, mais aucune métrique exploitable n'a été trouvée."
            : `${searchPerformance.clicks} clics / ${searchPerformance.impressions} impressions (${searchPerformance.periodLabel ?? "période non précisée"}).`;

  const checklist: SeoChecklistItem[] = [
    {
      id: "sitemap-coverage",
      label: "Couverture sitemap des pages clés",
      status: missingRequiredPages.length === 0 ? "ok" : "warning",
      detail:
        missingRequiredPages.length === 0
          ? "Toutes les pages publiques stratégiques sont présentes."
          : `${missingRequiredPages.length} page(s) manquante(s): ${missingRequiredPages.join(", ")}`,
    },
    {
      id: "robots-private",
      label: "Blocage robots des routes privées",
      status: missingPrivateDisallows.length === 0 ? "ok" : "warning",
      detail:
        missingPrivateDisallows.length === 0
          ? "Les préfixes privés attendus sont bien bloqués."
          : `Préfixes manquants dans disallow: ${missingPrivateDisallows.join(", ")}`,
    },
    {
      id: "rss",
      label: "Présence RSS dans sitemap",
      status: hasRssInSitemap ? "ok" : "warning",
      detail: hasRssInSitemap
        ? "Le flux RSS est bien listé dans le sitemap."
        : "Le flux RSS n'est pas listé dans le sitemap.",
    },
    {
      id: "content-cadence",
      label: "Cadence éditoriale (30 jours)",
      status: blogPostsLast30Days >= 2 ? "ok" : "warning",
      detail:
        blogPostsLast30Days >= 2
          ? `${blogPostsLast30Days} article(s) publiés sur 30 jours.`
          : `${blogPostsLast30Days} article(s) publiés sur 30 jours (objectif: 2+).`,
    },
    {
      id: "external-search-metrics",
      label: "Métriques Search Console / Bing",
      status: searchMetricsChecklistStatus,
      detail: searchMetricsChecklistDetail,
    },
  ];

  const recommendedActions: string[] = [];

  if (missingRequiredPages.length > 0) {
    recommendedActions.push(
      `Ajouter au sitemap: ${missingRequiredPages.join(", ")}.`,
    );
  }

  if (missingPrivateDisallows.length > 0) {
    recommendedActions.push(
      `Compléter robots.txt disallow: ${missingPrivateDisallows.join(", ")}.`,
    );
  }

  if (!hasRssInSitemap) {
    recommendedActions.push("Ajouter /rss.xml dans le sitemap principal.");
  }

  if (blogPostsLast30Days < 2) {
    recommendedActions.push(
      "Publier au moins 2 contenus SEO sur 30 jours pour maintenir la cadence.",
    );
  }

  if (searchPerformance.status === "not_configured") {
    recommendedActions.push(
      "Configurer SEO_SEARCH_METRICS_JSON, SEO_SEARCH_METRICS_ENDPOINT ou SEO_SEARCH_METRICS_FILE pour injecter les métriques GSC/Bing dans l'admin.",
    );
  }

  if (searchPerformance.status === "invalid") {
    recommendedActions.push(
      "Corriger le format des métriques SEO externes (JSON invalide) pour réactiver le suivi acquisition.",
    );
  }

  if (
    searchPerformance.status === "configured" &&
    searchPerformance.clicksDeltaPercent !== null &&
    searchPerformance.clicksDeltaPercent <= -30
  ) {
    recommendedActions.push(
      "Analyser la chute de clics SEO (>30%) entre périodes et déclencher un plan correctif (titles, snippets, maillage).",
    );
  }

  if (
    searchPerformance.status === "configured" &&
    searchPerformance.indexedPrivatePages !== null &&
    searchPerformance.indexedPrivatePages > 0
  ) {
    recommendedActions.push(
      "Traiter en priorité l'indexation de pages privées détectée via Search Console/Bing.",
    );
  }

  if (
    searchPerformance.status === "configured" &&
    searchPerformance.isSnapshotStale &&
    searchPerformance.snapshotAgeDays !== null
  ) {
    recommendedActions.push(
      `Déclencher un refresh des métriques SEO (snapshot âgé de ${searchPerformance.snapshotAgeDays} jours).`,
    );
  }

  if (
    searchPerformance.status === "configured" &&
    searchPerformance.contentRefreshCandidates.length > 0
  ) {
    const pages = searchPerformance.contentRefreshCandidates
      .slice(0, 3)
      .map((candidate) => candidate.path)
      .join(", ");
    recommendedActions.push(
      `Planifier un refresh SEO des contenus à faible CTR: ${pages}.`,
    );
  }

  if (searchPerformance.status === "configured") {
    const dueFollowUps = searchPerformance.refreshFollowUps.filter(
      (item) => item.status === "due",
    ).length;
    const overdueFollowUps = searchPerformance.refreshFollowUps.filter(
      (item) => item.status === "overdue",
    ).length;

    if (overdueFollowUps > 0) {
      recommendedActions.push(
        `Traiter le suivi post-refresh SEO en retard (${overdueFollowUps} checkpoint(s) J+14/J+30/J+60).`,
      );
    } else if (dueFollowUps > 0) {
      recommendedActions.push(
        `Exécuter les checkpoints post-refresh SEO à échéance (${dueFollowUps} checkpoint(s) à traiter).`,
      );
    }
  }

  if (recommendedActions.length === 0) {
    recommendedActions.push(
      "Exécuter la revue hebdo Search Console/Bing et ajuster le backlog contenu.",
    );
  }

  return {
    sitemapPublicUrlsCount: sitemapUrls.size,
    hasRssInSitemap,
    missingRequiredPages,
    blockedPrivateRoutesCount,
    missingPrivateDisallows,
    disallowCoveragePercent,
    blogPostsLast30Days,
    daysSinceLatestBlogPost,
    checklist,
    recommendedActions,
    searchPerformance,
  };
};
