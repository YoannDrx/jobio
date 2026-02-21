import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import DemoAnalytics from "@/features/landing/demos/demo-analytics";
import DemoKanban from "@/features/landing/demos/demo-kanban";
import DemoScoreRing from "@/features/landing/demos/demo-score-ring";
import DemoSequence from "@/features/landing/demos/demo-sequence";
import { LandingHeader } from "@/features/landing/landing-header";
import { NewsletterSection } from "@/features/landing/newsletter-section";
import { Footer } from "@/features/layout/footer";
import { PricingComparisonTable } from "@/features/plans/pricing-comparison-table";
import { Pricing } from "@/features/plans/pricing-section";
import { absoluteUrl, buildMarketingMetadata } from "@/lib/seo";
import { SiteConfig } from "@/site-config";
import {
  ArrowRight,
  Bot,
  ChartNoAxesCombined,
  Clock3,
  FileText,
  Layers3,
  ListChecks,
  Receipt,
  Sparkles,
  Target,
} from "lucide-react";
import Link from "next/link";

export const metadata = buildMarketingMetadata({
  title: SiteConfig.title,
  description: SiteConfig.description,
  path: "/",
  keywords: [
    "prospection freelance",
    "CRM freelance",
    "pipeline commercial freelance",
    "outil freelance tech",
    "relance client freelance",
  ],
});

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SiteConfig.company.name,
  url: SiteConfig.prodUrl,
  logo: absoluteUrl("/images/logo-icon.svg"),
  contactPoint: {
    "@type": "ContactPoint",
    email: "hello@jobio.fr",
    contactType: "customer support",
    availableLanguage: ["fr"],
  },
};

const softwareJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: SiteConfig.title,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: SiteConfig.prodUrl,
  description: SiteConfig.description,
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "EUR",
  },
};

const pillars = [
  {
    icon: Layers3,
    title: "Pipeline lisible",
    description:
      "Visualise toutes tes opportunités et repère instantanément les missions à débloquer.",
  },
  {
    icon: Bot,
    title: "IA contextuelle",
    description:
      "Parsing mission + rédaction d'emails adaptés à ton profil et au niveau de maturité du deal.",
  },
  {
    icon: Clock3,
    title: "Relances cadencées",
    description:
      "Automatise les suivis sans perdre la personnalisation grâce aux séquences et templates.",
  },
  {
    icon: ChartNoAxesCombined,
    title: "Pilotage concret",
    description:
      "Mesure conversion, TJM et vitesse de cycle pour ajuster ce qui compte vraiment.",
  },
];

const workflow = [
  {
    title: "Capture",
    detail:
      "Tu colles une URL ou un texte d'annonce. Jobio transforme la mission en fiche exploitable.",
  },
  {
    title: "Qualification",
    detail:
      "Le score IA et ton profil freelance t'aident à prioriser rapidement les opportunités pertinentes.",
  },
  {
    title: "Execution",
    detail:
      "Tu pilotes le pipeline, déclenches des séquences de relance et gardes une trace complète.",
  },
  {
    title: "Optimisation",
    detail:
      "Tu analyses tes résultats, identifies les plateformes rentables et ajustes ton process.",
  },
];

const productSuites = [
  {
    icon: Target,
    title: "Prospection & Dashboard",
    bullets: [
      "Pipeline missions (Kanban + liste + filtres avancés)",
      "CRM contacts avec interactions et scoring relationnel",
      "Relances manuelles + automatiques + séquences",
      "Analytics de conversion, vélocité et performance plateformes",
    ],
  },
  {
    icon: FileText,
    title: "CV Studio IA",
    bullets: [
      "CV Master centralisé par profil freelance",
      "Éditeur CV Lab multi-documents avec versions",
      "ATS scoring et recommandations d’amélioration",
      "Coach CV IA (plan Ultra) + export PDF",
    ],
  },
  {
    icon: Receipt,
    title: "Freelance Billing",
    bullets: [
      "Clients, devis, factures, paiements et catalogue",
      "Registres exports et suivi déclaratif",
      "Dépenses (factures, notes de frais, trajets)",
      "Prévision IA de trésorerie et conformité",
    ],
  },
];

const faqs = [
  {
    question: "Jobio s'adresse à qui exactement ?",
    answer:
      "Jobio est conçu pour les freelances tech qui veulent structurer leur prospection: développeurs, data, product, no-code, experts cloud, etc.",
  },
  {
    question: "Est-ce que je peux commencer gratuitement ?",
    answer:
      "Oui. Le plan Free te permet de tester le flux complet avec des limites de volume avant de passer en Pro ou Ultra.",
  },
  {
    question: "Le scoring IA remplace mon jugement ?",
    answer:
      "Non. Il sert de boussole pour prioriser rapidement, mais la décision finale reste toujours entre tes mains.",
  },
  {
    question: "Puis-je exporter mes données ?",
    answer:
      "Oui. Tu gardes la maîtrise de tes données et peux les récupérer ou supprimer ton compte depuis les paramètres.",
  },
];

export default function HomePage() {
  return (
    <div className="bg-background text-foreground relative min-h-screen overflow-x-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }}
      />
      <LandingHeader />

      <main className="pt-20">
        <section className="relative overflow-hidden pb-16 sm:pb-24">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="from-primary/15 via-brand-cyan/10 to-background absolute inset-0 bg-gradient-to-b" />
            <div className="bg-brand-cyan/25 absolute top-20 left-[8%] size-64 rounded-full blur-[90px]" />
            <div className="bg-brand-emerald/25 absolute top-8 right-[5%] size-72 rounded-full blur-[100px]" />
            <div className="bg-brand-amber/20 absolute bottom-0 left-[40%] size-72 rounded-full blur-[100px]" />
          </div>

          <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 pt-14 lg:px-8">
            <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
              <Badge className="mb-4">
                Le cockpit commercial des freelances tech
              </Badge>
              <h1 className="font-caption text-4xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-6xl lg:text-7xl">
                Prospection premium.
                <br />
                <span className="from-primary to-brand-emerald bg-gradient-to-r bg-clip-text text-transparent">
                  Exécution sans friction.
                </span>
              </h1>
              <p className="text-muted-foreground mt-6 max-w-2xl text-base leading-relaxed sm:text-lg">
                Jobio centralise ton pipeline, tes relances et tes indicateurs.
                Tu sais quoi faire, quand le faire, et pourquoi ça convertit.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/auth/signup"
                  className={buttonVariants({ size: "lg", variant: "default" })}
                >
                  Commencer gratuitement
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="#features"
                  className={buttonVariants({ size: "lg", variant: "outline" })}
                >
                  Voir les fonctionnalités
                </Link>
              </div>
              <p className="text-muted-foreground mt-4 text-xs">
                Sans carte bancaire • Setup rapide • Données exportables
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <StatCard value="15+" label="Plateformes freelance suivies" />
              <StatCard value="< 5 min" label="Pour capturer une mission" />
              <StatCard value="90 j" label="Historique analytics en Pro" />
              <StatCard value="24/7" label="Visibilité sur ton pipeline" />
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
              <Card className="overflow-hidden border-white/30 bg-white/80 shadow-2xl backdrop-blur-md dark:border-white/10 dark:bg-black/25">
                <CardHeader className="border-b">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Target className="text-primary size-4" />
                    Vue pipeline en temps réel
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-4">
                  <DemoKanban />
                </CardContent>
              </Card>
              <div className="grid gap-4">
                <Card className="border-white/30 bg-white/80 backdrop-blur-md dark:border-white/10 dark:bg-black/25">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">
                      Score mission instantané
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DemoScoreRing />
                  </CardContent>
                </Card>
                <Card className="border-white/30 bg-white/80 backdrop-blur-md dark:border-white/10 dark:bg-black/25">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">
                      Séquence de relance prête à exécuter
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DemoSequence />
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        <section
          id="features"
          className="mx-auto w-full max-w-7xl px-4 py-14 lg:px-8 lg:py-20"
        >
          <div className="mb-8 flex max-w-3xl flex-col gap-3">
            <Badge className="w-fit">Features</Badge>
            <h2 className="font-caption text-3xl font-semibold tracking-tight sm:text-5xl">
              Un système de prospection de bout en bout.
            </h2>
            <p className="text-muted-foreground text-base leading-relaxed">
              Jobio connecte capture, qualification, relance et pilotage pour te
              faire passer d&apos;un suivi artisanal à une machine commerciale
              fiable.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {pillars.map((pillar) => (
              <Card
                key={pillar.title}
                className="border-border/70 bg-card/80 hover:border-primary/40 transition-colors"
              >
                <CardContent className="p-5">
                  <div className="mb-2 flex items-center gap-2">
                    <pillar.icon className="text-primary size-4" />
                    <p className="font-medium">{pillar.title}</p>
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {pillar.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <Card className="border-border/70 overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Analytics exploitable</CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <DemoAnalytics />
              </CardContent>
            </Card>
            <Card className="border-border/70 bg-gradient-to-br from-cyan-500/10 via-transparent to-emerald-500/10">
              <CardContent className="flex h-full flex-col justify-between gap-5 p-6">
                <div>
                  <p className="text-sm font-medium">Résultat attendu</p>
                  <h3 className="font-caption mt-2 text-2xl font-semibold tracking-tight">
                    Plus de régularité, plus de conversions, moins d'oubli.
                  </h3>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <ListChecks className="text-primary size-4" />
                    Process commercial explicite
                  </li>
                  <li className="flex items-center gap-2">
                    <ListChecks className="text-primary size-4" />
                    Priorités quotidiennes visibles
                  </li>
                  <li className="flex items-center gap-2">
                    <ListChecks className="text-primary size-4" />
                    Feedback loop basé sur les données
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 py-12 lg:px-8 lg:py-16">
          <div className="mb-6 max-w-2xl">
            <Badge className="mb-3">Workflow</Badge>
            <h2 className="font-caption text-3xl font-semibold tracking-tight sm:text-4xl">
              Comment Jobio s&apos;intègre dans ton cycle commercial.
            </h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {workflow.map((item, index) => (
              <Card key={item.title} className="border-border/70">
                <CardContent className="p-5">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="font-medium">{item.title}</p>
                    <Badge variant="outline">{index + 1}</Badge>
                  </div>
                  <p className="text-muted-foreground text-sm">{item.detail}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 py-12 lg:px-8 lg:py-16">
          <div className="mb-6 max-w-3xl">
            <Badge className="mb-3">Suites produit</Badge>
            <h2 className="font-caption text-3xl font-semibold tracking-tight sm:text-4xl">
              Jobio couvre tout le cycle freelance, de la mission à la facture.
            </h2>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {productSuites.map((suite) => (
              <Card key={suite.title} className="border-border/70">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <suite.icon className="text-primary size-4" />
                    {suite.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    {suite.bullets.map((bullet) => (
                      <li key={bullet} className="flex items-start gap-2">
                        <ListChecks className="text-primary mt-0.5 size-4 shrink-0" />
                        <span className="text-muted-foreground">{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section id="pricing">
          <Pricing />
          <PricingComparisonTable />
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 py-14 lg:px-8 lg:py-20">
          <div className="mb-8 max-w-2xl">
            <Badge className="mb-3">FAQ</Badge>
            <h2 className="font-caption text-3xl font-semibold tracking-tight sm:text-4xl">
              Questions fréquentes
            </h2>
          </div>
          <Card className="border-border/70">
            <CardContent className="p-2 sm:p-4">
              <Accordion type="single" collapsible>
                {faqs.map((faq, index) => (
                  <AccordionItem key={faq.question} value={`faq-${index}`}>
                    <AccordionTrigger className="px-2 text-left text-base">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground px-2 text-sm">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </section>

        <NewsletterSection />

        <section className="mx-auto w-full max-w-7xl px-4 pb-16 lg:px-8 lg:pb-20">
          <div className="from-primary/10 via-brand-cyan/10 to-brand-emerald/10 rounded-3xl border bg-gradient-to-r p-8 sm:p-12">
            <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
              <Sparkles className="text-primary mb-3 size-5" />
              <h2 className="font-caption text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                Passe d&apos;un suivi opportuniste à un système commercial
                premium.
              </h2>
              <p className="text-muted-foreground mt-3 text-sm sm:text-base">
                Structure ton pipeline, automatise tes relances et pilote ta
                prospection comme une vraie activité revenue.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/auth/signup"
                  className={buttonVariants({ size: "lg", variant: "default" })}
                >
                  Créer mon compte
                </Link>
                <Link
                  href="/about"
                  className={buttonVariants({ size: "lg", variant: "outline" })}
                >
                  En savoir plus
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <Card className="border-white/30 bg-white/80 backdrop-blur-md dark:border-white/10 dark:bg-black/25">
      <CardContent className="p-4">
        <p className="font-caption text-2xl font-semibold tracking-tight">
          {value}
        </p>
        <p className="text-muted-foreground mt-1 text-xs">{label}</p>
      </CardContent>
    </Card>
  );
}
