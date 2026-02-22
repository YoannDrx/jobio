import { SiteConfig } from "@/site-config";
import type { BlogPost } from "@/features/blog/blog-data";
import type { MetadataRoute } from "next";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

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

type ComputeSeoKpiSummaryInput = {
  sitemapEntries: MetadataRoute.Sitemap;
  robotsRules: MetadataRoute.Robots["rules"];
  posts: BlogPost[];
  now: Date;
};

export const computeSeoKpiSummary = ({
  sitemapEntries,
  robotsRules,
  posts,
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
  };
};
