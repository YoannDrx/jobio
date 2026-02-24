import type { MetadataRoute } from "next";
import { SiteConfig } from "@/site-config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/api",
        "/app",
        "/auth",
        "/job",
        "/freelance",
        "/account",
        "/payment/success",
        "/payment/cancel",
      ],
    },
    host: SiteConfig.prodUrl,
    sitemap: `${SiteConfig.prodUrl}/sitemap.xml`,
  };
}
