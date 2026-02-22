import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  blogPosts,
  getAllBlogSlugs,
  getBlogPost,
} from "@/features/blog/blog-data";
import {
  PublicPageShell,
  PublicSection,
} from "@/features/layout/public-page-shell";
import { RelatedResourcesSection } from "@/features/layout/related-resources-section";
import { absoluteUrl, buildMarketingMetadata } from "@/lib/seo";
import { SiteConfig } from "@/site-config";
import { ArrowLeft, Calendar, Clock } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return getAllBlogSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    return {};
  }

  return buildMarketingMetadata({
    title: `${post.title} | ${SiteConfig.title}`,
    description: post.description,
    path: `/blog/${post.slug}`,
    type: "article",
    keywords: post.tags,
    publishedTime: post.date,
  });
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    notFound();
  }

  const postUrl = absoluteUrl(`/blog/${post.slug}`);
  const postWordCount = post.content
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean).length;
  const suggestedPosts = blogPosts
    .filter((item) => item.slug !== post.slug)
    .slice(0, 2);

  const relatedResources = [
    ...suggestedPosts.map((item) => ({
      href: `/blog/${item.slug}` as const,
      title: item.title,
      description: item.description,
      ctaLabel: "Lire l'article",
    })),
    {
      href: "/#pricing" as const,
      title: "Plans et limites Jobio",
      description:
        "Passe de la théorie à l'exécution avec le plan adapté à ton volume.",
      ctaLabel: "Voir les tarifs",
    },
  ];

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.date,
    wordCount: postWordCount,
    keywords: post.tags,
    mainEntityOfPage: postUrl,
    author: {
      "@type": "Organization",
      name: SiteConfig.company.name,
    },
    publisher: {
      "@type": "Organization",
      name: SiteConfig.company.name,
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/images/logo-icon.svg"),
      },
    },
  };

  const blogPostWebPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: post.title,
    url: postUrl,
    inLanguage: "fr-FR",
    description: post.description,
    isPartOf: {
      "@type": "WebSite",
      name: SiteConfig.title,
      url: SiteConfig.prodUrl,
    },
    about: post.tags,
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Accueil",
        item: absoluteUrl("/"),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Blog",
        item: absoluteUrl("/blog"),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: post.title,
        item: postUrl,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostWebPageJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <PublicPageShell
        badge="Blog"
        title={post.title}
        description={post.description}
        highlights={post.tags}
      >
        <div className="flex w-full flex-col gap-4">
          <div className="flex items-center justify-between">
            <Link
              href="/blog"
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              <ArrowLeft className="mr-1 size-4" />
              Retour au blog
            </Link>
            <div className="text-muted-foreground flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1">
                <Calendar className="size-4" />
                {new Date(post.date).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="size-4" />
                {post.readingTime} min de lecture
              </span>
            </div>
          </div>

          <PublicSection title="" description="">
            <div
              className="prose prose-neutral dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </PublicSection>

          <div className="flex flex-wrap gap-1.5">
            {post.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>

          <div className="pt-4">
            <Link href="/blog" className={buttonVariants({ variant: "outline" })}>
              <ArrowLeft className="mr-1 size-4" />
              Voir tous les articles
            </Link>
          </div>

          <RelatedResourcesSection
            title="Lectures liées"
            description="Continue avec des contenus complémentaires et le bon plan d'exécution."
            resources={relatedResources}
            className="mt-2"
          />
        </div>
      </PublicPageShell>
    </>
  );
}
