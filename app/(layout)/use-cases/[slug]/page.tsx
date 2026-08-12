import { BreadcrumbStructuredData } from "@/components/seo/breadcrumb-structured-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  PublicPageShell,
  PublicSection,
} from "@/features/layout/public-page-shell";
import { RelatedResourcesSection } from "@/features/layout/related-resources-section";
import {
  JOBIO_USE_CASES,
  getUseCaseBySlug,
  getUseCaseCanonicalUrl,
} from "@/features/seo/use-cases";
import { buildMarketingMetadata } from "@/lib/seo";
import { SiteConfig } from "@/site-config";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return JOBIO_USE_CASES.map((item) => ({
    slug: item.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const useCase = getUseCaseBySlug(slug);
  if (!useCase) {
    return buildMarketingMetadata({
      title: `Cas d’usage | ${SiteConfig.title}`,
      description:
        "Cas d'usage Jobio pour freelances tech: prospection, CV et facturation.",
      path: "/use-cases",
    });
  }

  return buildMarketingMetadata({
    title: `${useCase.persona} | ${SiteConfig.title}`,
    description: useCase.description,
    path: `/use-cases/${useCase.slug}`,
    keywords: useCase.keywords,
  });
}

export default async function UseCaseDetailPage({ params }: Props) {
  const { slug } = await params;
  const useCase = getUseCaseBySlug(slug);
  if (!useCase) {
    notFound();
  }

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: useCase.faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  const webPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `${useCase.persona} | ${SiteConfig.title}`,
    url: getUseCaseCanonicalUrl(useCase.slug),
    inLanguage: "fr-FR",
    description: useCase.description,
    isPartOf: {
      "@type": "WebSite",
      name: SiteConfig.title,
      url: SiteConfig.prodUrl,
    },
    about: useCase.keywords,
  };

  const howToJsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: `Workflow ${useCase.persona} avec Jobio`,
    description: useCase.summary,
    totalTime: "P7D",
    step: useCase.workflowSteps.map((step) => ({
      "@type": "HowToStep",
      name: step,
      text: step,
    })),
  };

  const relatedResources = [
    {
      href: "/features" as const,
      title: "Cartographie des fonctionnalités",
      description:
        "Vérifie les modules disponibles et les capacités plan-gatées.",
      ctaLabel: "Voir les fonctionnalités",
    },
    {
      href: "/docs" as const,
      title: "Documentation d'exécution",
      description:
        "Adopte le workflow quotidien recommandé (capture, relance, pilotage).",
      ctaLabel: "Lire la docs",
    },
    {
      href: `/?pv=${useCase.experimentVariant}&pe=use_case_${useCase.slug}#pricing` as const,
      title: "Plans et pricing",
      description:
        "Compare Free et Pro sur la base des limites réellement implémentées.",
      ctaLabel: "Comparer les plans",
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <BreadcrumbStructuredData
        items={[
          { name: "Accueil", path: "/" },
          { name: "Cas d’usage", path: "/use-cases" },
          { name: useCase.persona, path: `/use-cases/${useCase.slug}` },
        ]}
      />
      <PublicPageShell
        badge="Cas d’usage"
        title={useCase.title}
        description={useCase.summary}
        lastUpdated="23 février 2026"
        highlights={[
          useCase.persona,
          `Plan recommandé: ${useCase.recommendedPlan.toUpperCase()}`,
        ]}
      >
        <PublicSection
          title="Défis fréquents"
          description="Les points de friction les plus courants sur ce profil."
        >
          <ul className="space-y-2 text-sm">
            {useCase.painPoints.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="bg-primary mt-1.5 size-1.5 shrink-0 rounded-full" />
                <span className="text-muted-foreground">{item}</span>
              </li>
            ))}
          </ul>
        </PublicSection>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <PublicSection
            title="Workflow recommandé avec Jobio"
            description="Une séquence opérationnelle simple à exécuter chaque semaine."
          >
            <ol className="space-y-3">
              {useCase.workflowSteps.map((step, index) => (
                <li key={step} className="flex items-start gap-3">
                  <Badge variant="outline">{index + 1}</Badge>
                  <p className="text-sm">{step}</p>
                </li>
              ))}
            </ol>
          </PublicSection>

          <PublicSection
            title="Résultats attendus"
            description="Ce que tu dois observer quand le process est en place."
          >
            <ul className="space-y-2 text-sm">
              {useCase.outcomes.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="bg-brand-emerald mt-1.5 size-1.5 shrink-0 rounded-full" />
                  <span className="text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </PublicSection>
        </div>

        <PublicSection
          title="Modules Jobio les plus utiles"
          description="Accès direct vers les pages qui détaillent chaque partie du système."
          className="mt-4"
        >
          <div className="grid gap-3 md:grid-cols-3">
            {useCase.featureHighlights.map((item) => (
              <article key={item.title} className="rounded-xl border p-4">
                <p className="font-medium">{item.title}</p>
                <p className="text-muted-foreground mt-1 text-sm">
                  {item.description}
                </p>
                <Button asChild size="sm" variant="outline" className="mt-3">
                  <Link href={item.href}>Ouvrir</Link>
                </Button>
              </article>
            ))}
          </div>
        </PublicSection>

        <PublicSection
          title="FAQ"
          description="Réponses rapides pour ce profil."
          className="mt-4"
        >
          <div className="space-y-3">
            {useCase.faq.map((item) => (
              <article key={item.question} className="rounded-xl border p-4">
                <h2 className="font-medium">{item.question}</h2>
                <p className="text-muted-foreground mt-1 text-sm">
                  {item.answer}
                </p>
              </article>
            ))}
          </div>
        </PublicSection>

        <RelatedResourcesSection
          resources={relatedResources}
          className="mt-4"
          title="Passer à l'action"
          description="Approfondis la mise en œuvre et choisis le plan adapté."
        />

        <PublicSection title="CTA direct" className="mt-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4">
            <div>
              <p className="font-medium">Tester ce workflow sur ton activité</p>
              <p className="text-muted-foreground text-sm">
                Commence gratuitement et active Pro quand ton volume augmente.
              </p>
            </div>
            <div className="flex gap-2">
              <Button asChild>
                <Link href="/auth/signup">Créer un compte</Link>
              </Button>
              <Button asChild variant="outline">
                <Link
                  href={`/?pv=${useCase.experimentVariant}&pe=use_case_${useCase.slug}#pricing`}
                >
                  Voir les tarifs
                </Link>
              </Button>
            </div>
          </div>
        </PublicSection>
      </PublicPageShell>
    </>
  );
}
