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
  alternates?: Metadata["alternates"];
};

const DEFAULT_MARKETING_KEYWORDS = [
  "Jobio",
  "prospection freelance",
  "CRM freelance",
  "freelance tech",
  "pipeline commercial",
  "outils freelance",
];

const mergeKeywords = (keywords?: string[]) =>
  Array.from(
    new Set(
      [...DEFAULT_MARKETING_KEYWORDS, ...(keywords ?? [])]
        .map((keyword) => keyword.trim())
        .filter(Boolean),
    ),
  );

export const NO_INDEX_ROBOTS: Metadata["robots"] = {
  index: false,
  follow: false,
  googleBot: {
    index: false,
    follow: false,
    noimageindex: true,
  },
};

export const INDEX_ROBOTS: Metadata["robots"] = {
  index: true,
  follow: true,
  googleBot: {
    index: true,
    follow: true,
    "max-snippet": -1,
    "max-image-preview": "large",
    "max-video-preview": -1,
  },
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
  alternates,
}: BuildMarketingMetadataInput): Metadata => {
  const canonicalUrl = absoluteUrl(path);
  const imageUrl = absoluteUrl(imagePath);

  return {
    title,
    description,
    keywords: mergeKeywords(keywords),
    alternates: {
      ...alternates,
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
    robots: noIndex ? NO_INDEX_ROBOTS : INDEX_ROBOTS,
  };
};
