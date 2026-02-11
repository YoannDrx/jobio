import { SiteConfig } from "@/site-config";
import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return [
    {
      url: SiteConfig.prodUrl,
      lastModified: new Date(),
      changeFrequency: "monthly",
    },
    {
      url: `${SiteConfig.prodUrl}/auth/signin`,
      lastModified: new Date(),
      changeFrequency: "monthly",
    },
    {
      url: `${SiteConfig.prodUrl}/auth/signup`,
      lastModified: new Date(),
      changeFrequency: "monthly",
    },
    {
      url: `${SiteConfig.prodUrl}/legal/terms`,
      lastModified: new Date(),
      changeFrequency: "yearly",
    },
    {
      url: `${SiteConfig.prodUrl}/legal/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
    },
    {
      url: `${SiteConfig.prodUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
    },
    {
      url: `${SiteConfig.prodUrl}/docs`,
      lastModified: new Date(),
      changeFrequency: "weekly",
    },
    {
      url: `${SiteConfig.prodUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
    },
  ];
}
