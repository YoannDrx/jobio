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
      url: `${SiteConfig.prodUrl}/home`,
      lastModified: new Date(),
      changeFrequency: "monthly",
    },
  ];
}
