import type { MetadataRoute } from "next";
import { SiteConfig } from "@/site-config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/job",
        "/account",
        "/admin",
        "/api",
        "/auth/confirm-delete",
        "/auth/new-user",
        "/auth/verify",
        "/auth/forget-password",
        "/auth/reset-password",
        "/payment/success",
        "/payment/cancel",
      ],
    },
    host: SiteConfig.prodUrl,
    sitemap: `${SiteConfig.prodUrl}/sitemap.xml`,
  };
}
