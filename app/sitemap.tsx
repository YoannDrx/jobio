import { SiteConfig } from "@/site-config";
import { blogPosts } from "@/features/blog/blog-data";
import { prisma } from "@/lib/prisma";
import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const publicPages = [
    "/",
    "/about",
    "/features",
    "/blog",
    "/docs",
    "/contact",
    "/branding",
    "/legal/terms",
    "/legal/privacy",
  ] as const;

  const changeFrequencyByPage: Partial<
    Record<(typeof publicPages)[number], MetadataRoute.Sitemap[number]["changeFrequency"]>
  > = {
    "/": "weekly",
    "/blog": "weekly",
    "/docs": "weekly",
    "/about": "monthly",
    "/features": "monthly",
    "/contact": "monthly",
    "/branding": "monthly",
    "/legal/terms": "yearly",
    "/legal/privacy": "yearly",
  };

  const priorityByPage: Partial<
    Record<(typeof publicPages)[number], number>
  > = {
    "/": 1,
    "/features": 0.8,
    "/blog": 0.7,
    "/docs": 0.7,
    "/about": 0.6,
    "/contact": 0.6,
    "/branding": 0.4,
    "/legal/terms": 0.3,
    "/legal/privacy": 0.3,
  };

  const blogPages = blogPosts.map((post) => ({
    url: `${SiteConfig.prodUrl}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const publicPortals = await (async () => {
    try {
      const portals = await prisma.clientPortal.findMany({
        where: {
          isPublic: true,
        },
        select: {
          slug: true,
          updatedAt: true,
        },
        orderBy: {
          updatedAt: "desc",
        },
        take: 5000,
      });

      return portals.map((portal) => ({
        url: `${SiteConfig.prodUrl}/p/${portal.slug}`,
        lastModified: portal.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      }));
    } catch {
      // When DB or table is unavailable (build previews, fresh env), keep sitemap generation resilient.
      return [];
    }
  })();

  return [
    ...publicPages.map((page) => ({
      url: `${SiteConfig.prodUrl}${page === "/" ? "" : page}`,
      lastModified: now,
      changeFrequency: changeFrequencyByPage[page] ?? "monthly",
      priority: priorityByPage[page] ?? 0.5,
    })),
    ...blogPages,
    ...publicPortals,
  ];
}
