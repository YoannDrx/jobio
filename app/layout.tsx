import "@/lib/zod-error-map";
import { TailwindIndicator } from "@/components/utils/tailwind-indicator";
import { NextTopLoader } from "@/features/page/next-top-loader";
import { ServerToaster } from "@/features/server-sonner/server-toaster";
import { INDEX_ROBOTS, absoluteUrl } from "@/lib/seo";
import { cn } from "@/lib/utils";
import { SiteConfig } from "@/site-config";
import type { LayoutParams } from "@/types/next";
import type { Metadata } from "next";
import { Geist_Mono, Inter, Space_Grotesk } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { type ReactNode, Suspense } from "react";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: SiteConfig.title,
  description: SiteConfig.description,
  metadataBase: new URL(SiteConfig.prodUrl),
  applicationName: SiteConfig.title,
  keywords: [
    "Jobio",
    "prospection freelance",
    "CRM freelance",
    "pipeline missions",
    "freelance tech",
  ],
  authors: [{ name: SiteConfig.company.name }],
  creator: SiteConfig.company.name,
  publisher: SiteConfig.company.name,
  alternates: {
    canonical: SiteConfig.prodUrl,
    types: {
      "application/rss+xml": absoluteUrl("/rss.xml"),
    },
  },
  openGraph: {
    title: SiteConfig.title,
    description: SiteConfig.description,
    type: "website",
    locale: "fr_FR",
    siteName: SiteConfig.title,
    url: SiteConfig.prodUrl,
    images: [
      {
        url: absoluteUrl("/images/hero.png"),
        width: 1200,
        height: 630,
        alt: SiteConfig.title,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SiteConfig.title,
    description: SiteConfig.description,
    images: [absoluteUrl("/images/hero.png")],
  },
  robots: INDEX_ROBOTS,
};

const CaptionFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-caption",
});

const GeistSans = Inter({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const GeistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export default function RootLayout({
  children,
  modal,
}: LayoutParams & { modal?: ReactNode }) {
  return (
    <html lang="fr" className="h-full" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={cn(
          "bg-background h-full font-sans antialiased",
          GeistMono.variable,
          GeistSans.variable,
          CaptionFont.variable,
        )}
      >
        <NuqsAdapter>
          <Providers>
            <NextTopLoader
              delay={100}
              showSpinner={false}
              color="hsl(var(--primary))"
            />
            <Suspense fallback={null}>
              {children}
              {modal}
            </Suspense>
            <TailwindIndicator />
            <Suspense>
              <ServerToaster />
            </Suspense>
          </Providers>
        </NuqsAdapter>
      </body>
    </html>
  );
}
