import { Badge } from "@/components/ui/badge";
import { BreadcrumbStructuredData } from "@/components/seo/breadcrumb-structured-data";
import { blogPosts } from "@/features/blog/blog-data";
import {
  PublicPageShell,
  PublicSection,
} from "@/features/layout/public-page-shell";
import { absoluteUrl, buildMarketingMetadata } from "@/lib/seo";
import { SiteConfig } from "@/site-config";
import { Calendar, Clock } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = buildMarketingMetadata({
  title: `Blog | ${SiteConfig.title}`,
  description:
    "Conseils, strategies et bonnes pratiques pour les freelances tech : prospection, LinkedIn, TJM, productivite et plus.",
  path: "/blog",
  alternates: {
    types: {
      "application/rss+xml": absoluteUrl("/rss.xml"),
    },
  },
});

export default function BlogPage() {
  const blogCollectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: `${SiteConfig.title} Blog`,
    url: absoluteUrl("/blog"),
    description:
      "Articles pratiques pour freelances tech: prospection, LinkedIn, TJM et execution commerciale.",
    inLanguage: "fr-FR",
    blogPost: blogPosts.map((post) => ({
      "@type": "BlogPosting",
      headline: post.title,
      datePublished: post.date,
      url: absoluteUrl(`/blog/${post.slug}`),
    })),
  };

  return (
    <>
      <BreadcrumbStructuredData
        items={[
          { name: "Accueil", path: "/" },
          { name: "Blog", path: "/blog" },
        ]}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogCollectionJsonLd) }}
      />
      <PublicPageShell
        badge="Blog"
        title="Ressources pour freelances tech ambitieux."
        description="Conseils concrets, retours d'experience et strategies pour structurer ta prospection, ameliorer ta visibilite et signer plus de missions."
        highlights={["Prospection", "LinkedIn", "TJM"]}
      >
        <div className="grid w-full gap-4 md:grid-cols-2 lg:grid-cols-3">
          {blogPosts.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="group">
              <PublicSection
                title={post.title}
                description={post.description}
                className="h-full transition-shadow group-hover:shadow-md"
              >
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap gap-1.5">
                    {post.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <div className="text-muted-foreground flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-1">
                      <Calendar className="size-3.5" />
                      {new Date(post.date).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="size-3.5" />
                      {post.readingTime} min de lecture
                    </span>
                  </div>
                </div>
              </PublicSection>
            </Link>
          ))}
        </div>
      </PublicPageShell>
    </>
  );
}
