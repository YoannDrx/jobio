import { BreadcrumbStructuredData } from "@/components/seo/breadcrumb-structured-data";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  PublicPageShell,
  PublicSection,
} from "@/features/layout/public-page-shell";
import { RelatedResourcesSection } from "@/features/layout/related-resources-section";
import { JOBIO_USE_CASES } from "@/features/seo/use-cases";
import { absoluteUrl, buildMarketingMetadata } from "@/lib/seo";
import { SiteConfig } from "@/site-config";
import Link from "next/link";

export const metadata = buildMarketingMetadata({
  title: `Use Cases Freelance | ${SiteConfig.title}`,
  description:
    "Découvre comment Jobio s'adapte aux différents profils freelance tech: développeur, data/IA, product et no-code.",
  path: "/use-cases",
  keywords: [
    "use case freelance",
    "crm freelance tech",
    "prospection freelance développeur",
    "prospection data freelance",
    "facturation freelance no-code",
  ],
});

const relatedResources = [
  {
    href: "/features" as const,
    title: "Explorer les fonctionnalités",
    description:
      "Pipeline, IA, relances, CV Studio et facturation: vue détaillée des modules.",
    ctaLabel: "Voir les fonctionnalités",
  },
  {
    href: "/docs" as const,
    title: "Mode d'emploi opérationnel",
    description:
      "Workflow quotidien, bonnes pratiques et exécution terrain avec Jobio.",
    ctaLabel: "Lire la documentation",
  },
  {
    href: "/#pricing" as const,
    title: "Comparer les plans",
    description:
      "Choisis le plan Free, Pro ou Ultra selon ton volume et tes objectifs.",
    ctaLabel: "Voir les tarifs",
  },
];

const webPageJsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: `Use Cases Freelance | ${SiteConfig.title}`,
  url: absoluteUrl("/use-cases"),
  inLanguage: "fr-FR",
  description:
    "Collection des cas d'usage Jobio pour freelances tech: développeur, data/IA, product et no-code.",
  isPartOf: {
    "@type": "WebSite",
    name: SiteConfig.title,
    url: SiteConfig.prodUrl,
  },
};

const itemListJsonLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  itemListElement: JOBIO_USE_CASES.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    url: absoluteUrl(`/use-cases/${item.slug}`),
    name: item.persona,
  })),
};

export default function UseCasesPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <BreadcrumbStructuredData
        items={[
          { name: "Accueil", path: "/" },
          { name: "Use cases", path: "/use-cases" },
        ]}
      />
      <PublicPageShell
        badge="Use cases"
        title="Des parcours adaptés à chaque profil freelance tech."
        description="Chaque cas d'usage relie acquisition, relance, CV et facturation pour t'aider à exécuter un workflow commercial complet."
        lastUpdated="23 février 2026"
        highlights={[
          "Développeur freelance",
          "Data / IA freelance",
          "Product / no-code freelance",
        ]}
      >
        <PublicSection
          title="Choisis ton cas d'usage"
          description="Explore la page correspondant à ton activité principale."
        >
          <div className="grid gap-4 md:grid-cols-3">
            {JOBIO_USE_CASES.map((item) => (
              <article
                key={item.slug}
                className="flex h-full flex-col rounded-xl border p-4"
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="font-medium">{item.persona}</p>
                  <Badge variant="outline" className="capitalize">
                    {item.recommendedPlan}
                  </Badge>
                </div>
                <h2 className="text-base leading-snug font-semibold">
                  {item.title}
                </h2>
                <p className="text-muted-foreground mt-2 text-sm">
                  {item.summary}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {item.keywords.slice(0, 2).map((keyword) => (
                    <Badge key={keyword} variant="secondary">
                      {keyword}
                    </Badge>
                  ))}
                </div>
                <Link
                  href={`/use-cases/${item.slug}`}
                  className={`${buttonVariants({
                    size: "sm",
                    variant: "outline",
                  })} mt-5 w-fit`}
                >
                  Voir le guide
                </Link>
              </article>
            ))}
          </div>
        </PublicSection>

        <RelatedResourcesSection
          resources={relatedResources}
          className="mt-4"
          description="Complète la lecture avec la matrice fonctionnalités, les workflows docs et le pricing."
        />
      </PublicPageShell>
    </>
  );
}

