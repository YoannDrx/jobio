import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  blogPosts,
  type BlogPost,
  getAllBlogSlugs,
  getBlogPost,
} from "@/features/blog/blog-data";
import {
  BlogPostToc,
  type BlogPostTocSection,
} from "@/features/blog/blog-post-toc";
import { PublicPageShell } from "@/features/layout/public-page-shell";
import { cn } from "@/lib/utils";
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

type BlogSection = {
  id: string;
  title: string;
  bodyHtml: string;
  isIntroduction?: boolean;
};

const stripHtmlTags = (input: string): string =>
  input.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

const stripFirstH2Heading = (input: string): string =>
  input.replace(/^\s*<h2[^>]*>[\s\S]*?<\/h2>/i, "").trim();

const splitBlogContentIntoSections = (content: string): BlogSection[] => {
  const normalized = content.trim();
  if (!normalized) return [];

  const firstHeadingIndex = normalized.search(/<h2[^>]*>/i);
  const introHtml =
    firstHeadingIndex > 0 ? normalized.slice(0, firstHeadingIndex).trim() : "";
  const sectionSource =
    firstHeadingIndex >= 0 ? normalized.slice(firstHeadingIndex) : normalized;

  const sectionMatches = sectionSource.match(/<h2[\s\S]*?(?=<h2|$)/gi);
  const rawSections =
    sectionMatches && sectionMatches.length > 0 ? sectionMatches : [sectionSource];

  const sections: BlogSection[] = [];

  if (introHtml) {
    sections.push({
      id: "section-introduction",
      title: "Introduction",
      bodyHtml: introHtml,
      isIntroduction: true,
    });
  }

  rawSections.forEach((rawSection, index) => {
    const headingMatch = rawSection.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
    const fallbackTitle = `Section ${index + 1}`;
    const headingText = stripHtmlTags(headingMatch?.[1] ?? fallbackTitle);
    const sectionId = `section-${index + 1}`;
    const bodyHtml = stripFirstH2Heading(rawSection);

    sections.push({
      id: sectionId,
      title: headingText || fallbackTitle,
      bodyHtml: bodyHtml || rawSection.trim(),
    });
  });

  return sections;
};

const getSectionLabel = (sections: BlogSection[], index: number): string => {
  const section = sections[index];
  if (section.isIntroduction) {
    return "Intro";
  }
  const numberedCount = sections
    .slice(0, index + 1)
    .filter((item) => !item.isIntroduction).length;
  return String(numberedCount).padStart(2, "0");
};

const buildTocSections = (sections: BlogSection[]): BlogPostTocSection[] =>
  sections.map((section, index) => ({
    id: section.id,
    title: section.title,
    label: getSectionLabel(sections, index),
  }));

const getRelatedResources = (post: BlogPost) => {
  const suggestedPosts = blogPosts
    .filter((item) => item.slug !== post.slug)
    .slice(0, 2);

  return [
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
  const relatedResources = getRelatedResources(post);

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

  const sections = splitBlogContentIntoSections(post.content);
  const tocSections = buildTocSections(sections);

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
        <div className="grid w-full gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="flex min-w-0 flex-col gap-4">
            <Card className="gap-0 overflow-hidden border border-black/5 bg-white/80 py-0 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-black/20">
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                <Link
                  href="/blog"
                  className={buttonVariants({ variant: "ghost", size: "sm" })}
                >
                  <ArrowLeft className="mr-1 size-4" />
                  Retour au blog
                </Link>
                <div className="text-muted-foreground flex flex-wrap items-center gap-4 text-sm">
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
              </CardContent>
            </Card>

            <Card className="gap-0 overflow-hidden border border-black/5 bg-white/80 py-0 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-black/20 lg:hidden">
              <CardContent className="p-4 sm:p-5">
                <details>
                  <summary className="cursor-pointer text-sm font-semibold">
                    Sommaire de l&apos;article
                  </summary>
                  <BlogPostToc
                    sections={tocSections}
                    className="mt-3 flex flex-col gap-1.5"
                    itemClassName="text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/8 flex items-start gap-2 rounded-md px-2 py-1.5 text-sm transition-colors"
                    activeItemClassName="bg-black/5 text-foreground dark:bg-white/10 dark:text-zinc-100"
                    labelClassName="text-muted-foreground text-xs font-medium"
                    activeLabelClassName="text-foreground dark:text-zinc-100"
                    titleClassName="leading-snug"
                  />
                </details>
              </CardContent>
            </Card>

            {sections.map((section, index) => (
              <Card
                key={section.id}
                id={section.id}
                className={cn(
                  "scroll-mt-24 gap-0 overflow-hidden border border-black/5 bg-white/80 py-0 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-black/20",
                )}
              >
                <div className="border-b border-black/5 px-6 py-4 dark:border-white/10 sm:px-8">
                  <div className="flex items-center gap-2.5">
                    <Badge variant="outline" className="text-xs font-medium">
                      {getSectionLabel(sections, index)}
                    </Badge>
                    <h2 className="text-lg font-semibold tracking-tight sm:text-xl">
                      {section.title}
                    </h2>
                  </div>
                </div>
                <CardContent className="px-6 py-6 sm:px-8 sm:py-7">
                  <article
                    className="typography mx-auto max-w-[72ch] [&_h2]:hidden [&_h3]:mt-10 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:tracking-tight [&_h3]:text-foreground dark:[&_h3]:text-zinc-100 [&_p]:text-muted-foreground dark:[&_p]:text-zinc-300 [&_li]:text-muted-foreground dark:[&_li]:text-zinc-300 [&_ul]:space-y-1 [&_ol]:space-y-1 [&_blockquote]:rounded-r-xl [&_blockquote]:border-l-4 [&_blockquote]:border-black/20 [&_blockquote]:bg-black/3 [&_blockquote]:py-3 [&_blockquote]:pr-3 dark:[&_blockquote]:border-white/25 dark:[&_blockquote]:bg-white/5 [&_a]:font-semibold [&_a]:decoration-2 [&_strong]:font-semibold [&_strong]:text-foreground dark:[&_strong]:text-zinc-100 [&_table]:block [&_table]:overflow-x-auto"
                    dangerouslySetInnerHTML={{ __html: section.bodyHtml }}
                  />
                </CardContent>
              </Card>
            ))}

            <div className="flex flex-wrap gap-1.5">
              {post.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>

            <div className="pt-2">
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

          <div className="hidden lg:block lg:self-start">
            <Card className="sticky top-24 max-h-[calc(100vh-7rem)] gap-3 overflow-hidden border border-black/5 bg-white/80 py-5 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-black/20">
              <CardContent className="px-5">
                <p className="text-sm font-semibold">Sommaire</p>
                <BlogPostToc
                  sections={tocSections}
                  className="mt-3 flex max-h-[calc(100vh-11rem)] flex-col gap-1.5 overflow-y-auto pr-1"
                  itemClassName="text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/8 flex items-start gap-2 rounded-md px-2 py-1.5 text-sm transition-colors"
                  activeItemClassName="bg-black/5 text-foreground dark:bg-white/10 dark:text-zinc-100"
                  labelClassName="text-muted-foreground text-xs font-medium"
                  activeLabelClassName="text-foreground dark:text-zinc-100"
                  titleClassName="leading-snug"
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </PublicPageShell>
    </>
  );
}
