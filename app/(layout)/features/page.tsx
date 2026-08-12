import { BreadcrumbStructuredData } from "@/components/seo/breadcrumb-structured-data";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  PublicPageShell,
  PublicSection,
} from "@/features/layout/public-page-shell";
import { RelatedResourcesSection } from "@/features/layout/related-resources-section";
import { withPlanBadge } from "@/features/plans/plan-copy";
import { absoluteUrl, buildMarketingMetadata } from "@/lib/seo";
import { SiteConfig } from "@/site-config";
import {
  BarChart3,
  Bell,
  CalendarCheck,
  Check,
  FileText,
  Globe,
  Kanban,
  Receipt,
  Sparkles,
  UserCircle,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const metadata = buildMarketingMetadata({
  title: `Fonctionnalites | ${SiteConfig.title}`,
  description:
    "Decouvrez toutes les fonctionnalites de Jobio : pipeline commercial, CRM contacts, relances, profils freelance, IA, analytics et plus.",
  path: "/features",
  keywords: [
    "crm freelance tech",
    "organiser prospection freelance",
    "relance client freelance",
    "outil facturation freelance",
    "cv freelance ats",
  ],
});

type FeatureSection = {
  icon: LucideIcon;
  title: string;
  description: string;
  bullets: string[];
};

const featureSections: FeatureSection[] = [
  {
    icon: Kanban,
    title: "Pipeline Commercial",
    description:
      "Visualise et pilote ton cycle de vente du premier contact a la signature.",
    bullets: [
      "Vue Kanban + liste pour piloter chaque mission",
      "Capture rapide de missions avec parsing IA",
      "Scoring automatique des opportunites",
      withPlanBadge("Filtres avances et export CSV", "csvExport"),
    ],
  },
  {
    icon: Users,
    title: "CRM Contacts",
    description:
      "Centralise tous tes contacts professionnels et garde le lien.",
    bullets: [
      "CRUD complet avec fiche contact detaillee",
      "Detection de doublons et fusion intelligente",
      "Import/export contacts en masse",
      "Systeme de tags et segmentation",
    ],
  },
  {
    icon: CalendarCheck,
    title: "Relances & Suivi",
    description: "Ne rate plus jamais une relance au bon moment.",
    bullets: [
      "Calendrier de relances avec vue timeline",
      "4 types de relances configurables",
      "Snooze et report en un clic",
      withPlanBadge("Sequences de relance automatisees", "sequences"),
    ],
  },
  {
    icon: UserCircle,
    title: "Profils Freelance",
    description:
      "Gere plusieurs profils adaptes a tes differents marches cibles.",
    bullets: [
      "Multi-profils avec switch rapide",
      "Import LinkedIn en un clic",
      "Gestion des competences et experiences",
    ],
  },
  {
    icon: Sparkles,
    title: "Intelligence Artificielle",
    description: "L'IA qui accelere ta prospection sans la deshumaniser.",
    bullets: [
      "Parsing automatique des offres de missions",
      "Scoring predictif des opportunites",
      withPlanBadge(
        "Generation d'emails de prospection personnalises",
        "aiEmailGeneration",
      ),
      withPlanBadge("Audit LinkedIn assiste", "aiLinkedinAudit"),
    ],
  },
  {
    icon: FileText,
    title: "CV Studio IA",
    description:
      "Construis et adaptes tes CV selon les missions cibles, avec assistance IA.",
    bullets: [
      "CV Master centralise par profil freelance",
      "CV Lab multi-documents avec versions",
      withPlanBadge(
        "ATS scoring et recommandations actionnables",
        "atsScoring",
      ),
      withPlanBadge("Coach CV IA et export PDF", "cvCoachAI"),
    ],
  },
  {
    icon: Receipt,
    title: "Freelance Billing",
    description:
      "Gere l'administratif freelance: clients, devis, factures, paiements et registres.",
    bullets: [
      "Gestion clients, catalogue, devis et factures",
      "Paiements, avoirs et exports de registres",
      "Module depenses (factures, notes de frais, trajets)",
      "Insights de conformite et prevision IA",
    ],
  },
  {
    icon: BarChart3,
    title: "Analytics & Performance",
    description: "Mesure, comprends et ameliore ta prospection.",
    bullets: [
      "KPIs cles : taux de conversion, delais, volume",
      "Entonnoir de prospection visuel",
      "Suivi TJM et revenus",
      "Forecast de chiffre d'affaires",
    ],
  },
  {
    icon: Globe,
    title: "Plateformes",
    description: "Gere ta presence sur toutes les plateformes de freelancing.",
    bullets: [
      "Catalogue de plateformes generalistes et specialisees",
      "Suivi des statuts d'inscription",
      "URL de profil par plateforme",
      "Checklist de progression par plateforme",
    ],
  },
  {
    icon: Bell,
    title: "Notifications & Emails",
    description: "Reste informe sans etre submerge.",
    bullets: [
      "Notifications in-app en temps reel",
      "Emails transactionnels automatises",
      "Tracking d'ouverture et de clics",
    ],
  },
];

const relatedResources = [
  {
    href: "/use-cases" as const,
    title: "Parcours par profil freelance",
    description:
      "Choisis un use case (développeur, data/IA, product/no-code) pour voir le workflow recommandé.",
    ctaLabel: "Voir les cas d’usage",
  },
  {
    href: "/docs" as const,
    title: "Guide d'exécution",
    description:
      "Mets en place ton workflow quotidien de prospection avec la documentation opérationnelle.",
    ctaLabel: "Lire les docs",
  },
  {
    href: "/blog" as const,
    title: "Conseils terrain",
    description:
      "Explore les retours d'expérience freelance sur prospection, LinkedIn et négociation.",
    ctaLabel: "Voir le blog",
  },
  {
    href: "/#pricing" as const,
    title: "Plans & limites",
    description:
      "Compare Free et Pro pour choisir les capacités adaptées à ton volume.",
    ctaLabel: "Comparer les plans",
  },
];

const featureFaqs = [
  {
    id: "crm-freelance",
    question: "Jobio est-il un CRM freelance adapte aux profils tech ?",
    answer:
      "Oui. Jobio combine pipeline missions, CRM contacts, relances et analytics dans un setup pense pour les freelances tech. L'objectif est de piloter la prospection sans multiplier les outils.",
  },
  {
    id: "prospection-organisation",
    question: "Comment Jobio aide a organiser la prospection freelance ?",
    answer:
      "Tu centralises les opportunites, tu qualifies avec le scoring IA, tu planifies les relances et tu mesures les conversions. Chaque mission garde une prochaine action claire.",
  },
  {
    id: "cv-ats",
    question: "Le module CV couvre-t-il les besoins ATS en freelance ?",
    answer:
      "Oui. CV Studio IA inclut en Pro un scoring ATS avec recommandations actionnables, la gestion de plusieurs versions et le Coach CV IA.",
  },
  {
    id: "facturation",
    question: "Peut-on gerer devis et factures dans Jobio ?",
    answer:
      "Oui. Le module Freelance Billing gere clients, devis, factures, paiements, avoirs, depenses et registres exportables pour garder une continuité entre prospection et administratif.",
  },
  {
    id: "plans",
    question: "Les fonctionnalites varient-elles selon le plan ?",
    answer:
      "Oui. Les volumes et certaines capacités (IA et automatisation) dépendent du plan Free ou Pro. La section tarifaire reprend les droits réellement appliqués.",
  },
] as const;

const featureFaqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: featureFaqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
};

const featuresWebPageJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: `Fonctionnalites | ${SiteConfig.title}`,
  url: absoluteUrl("/features"),
  inLanguage: "fr-FR",
  description:
    "Panorama des fonctionnalités Jobio pour freelances tech: pipeline, CRM, relances, CV Studio IA, facturation et analytics.",
  isPartOf: {
    "@type": "WebSite",
    name: SiteConfig.title,
    url: SiteConfig.prodUrl,
  },
  about: [
    "crm freelance tech",
    "prospection freelance",
    "relances automatisées",
    "cv freelance ats",
    "facturation freelance",
  ],
};

export default function FeaturesPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(featuresWebPageJsonLd),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(featureFaqJsonLd) }}
      />
      <BreadcrumbStructuredData
        items={[
          { name: "Accueil", path: "/" },
          { name: "Fonctionnalites", path: "/features" },
        ]}
      />
      <PublicPageShell
        badge="Fonctionnalites"
        title="Tout ce dont un freelance tech a besoin pour prospecter."
        description="Un outil unique qui regroupe pipeline, CRM, relances, profils, IA et analytics pour structurer et accelerer ta prospection commerciale."
        highlights={["IA integree", "Pipeline visuel", "Analytics avances"]}
      >
        <div className="grid w-full gap-4 md:grid-cols-2">
          {featureSections.map((section) => (
            <PublicSection
              key={section.title}
              title={section.title}
              description={section.description}
            >
              <div className="mb-3 flex items-center gap-2">
                <section.icon className="text-primary size-5" />
                <span className="text-muted-foreground text-sm font-medium">
                  Points cles
                </span>
              </div>
              <ul className="flex flex-col gap-2">
                {section.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-2 text-sm">
                    <Check className="text-primary mt-0.5 size-4 shrink-0" />
                    <span className="text-muted-foreground">{bullet}</span>
                  </li>
                ))}
              </ul>
            </PublicSection>
          ))}
        </div>

        <PublicSection
          title="FAQ - CRM freelance et prospection"
          description="Questions frequentes des freelances tech avant de choisir leur stack commerciale."
          className="mt-4"
        >
          <Accordion type="single" collapsible className="w-full">
            {featureFaqs.map((faq) => (
              <AccordionItem key={faq.id} value={faq.id}>
                <AccordionTrigger className="text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </PublicSection>

        <RelatedResourcesSection
          title="Pour aller plus loin"
          description="Relie les fonctionnalités à ton setup, ton apprentissage et ton plan."
          resources={relatedResources}
          className="mt-4"
        />
      </PublicPageShell>
    </>
  );
}
