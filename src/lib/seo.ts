import { SiteConfig } from "@/site-config";
import type { Metadata } from "next";

type BuildMarketingMetadataInput = {
  title: string;
  description: string;
  path: `/${string}` | "/";
  type?: "website" | "article";
  imagePath?: `/${string}`;
  keywords?: string[];
  noIndex?: boolean;
  publishedTime?: string;
};

export const absoluteUrl = (path: `/${string}` | "/") =>
  `${SiteConfig.prodUrl}${path === "/" ? "" : path}`;

export const buildMarketingMetadata = ({
  title,
  description,
  path,
  type = "website",
  imagePath = "/images/hero.png",
  keywords,
  noIndex = false,
  publishedTime,
}: BuildMarketingMetadataInput): Metadata => {
  const canonicalUrl = absoluteUrl(path);
  const imageUrl = absoluteUrl(imagePath);

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      type,
      locale: "fr_FR",
      siteName: SiteConfig.title,
      url: canonicalUrl,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      publishedTime,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
          googleBot: {
            index: false,
            follow: false,
          },
        }
      : undefined,
  };
};
