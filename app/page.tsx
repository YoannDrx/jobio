import { LandingHeader } from "@/features/landing/landing-header";
import { NewsletterSection } from "@/features/landing/newsletter-section";
import { BeforeAfterSection } from "@/features/landing/sections/before-after-section";
import { FeaturesSection } from "@/features/landing/sections/features-section";
import { HeroSection } from "@/features/landing/sections/hero-section";
import { ProductSuitesSection } from "@/features/landing/sections/product-suites-section";
import { TrustSection } from "@/features/landing/sections/trust-section";
import { UseCasesSection } from "@/features/landing/sections/use-cases-section";
import { WorkflowSection } from "@/features/landing/sections/workflow-section";
import { FaqSection } from "@/features/landing/sections/faq-section";
import { FinalCtaSection } from "@/features/landing/sections/final-cta-section";
import { Footer } from "@/features/layout/footer";
import { PricingComparisonTable } from "@/features/plans/pricing-comparison-table";
import { Pricing } from "@/features/plans/pricing-section";
import { absoluteUrl, buildMarketingMetadata } from "@/lib/seo";
import { SiteConfig } from "@/site-config";

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
    email: SiteConfig.supportEmail,
    contactType: "customer support",
    availableLanguage: ["fr"],
  },
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SiteConfig.title,
  url: SiteConfig.prodUrl,
  inLanguage: "fr-FR",
  publisher: {
    "@type": "Organization",
    name: SiteConfig.company.name,
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

const faqs = [
  {
    question: "Jobio s'adresse à qui exactement ?",
    answer:
      "Jobio est conçu pour les freelances tech qui veulent structurer leur prospection: développeurs, data, product, no-code, experts cloud, etc.",
  },
  {
    question: "Est-ce que je peux commencer gratuitement ?",
    answer:
      "Oui. Chaque nouveau compte bénéficie de 14 jours de Pro sans carte, puis repasse automatiquement sur le plan Free.",
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
  {
    question: "Comment Jobio protège mes données ?",
    answer:
      "Jobio applique des contrôles d’accès côté serveur et documente ses sous-traitants et transferts internationaux dans sa politique de confidentialité. Tu peux exporter ou supprimer tes données depuis les paramètres.",
  },
  {
    question: "Puis-je connecter Jobio à mes outils ?",
    answer:
      "Jobio fonctionne en standalone. Tu importes tes missions par URL ou copier-coller, sans intégration complexe à configurer.",
  },
  {
    question: "Quelle différence entre Free et Pro ?",
    answer:
      "Free permet de gérer un volume raisonnable. Pro ajoute le Coach CV, les automatisations, davantage d’IA, les analytics complets et la gestion d’activité sans limites usuelles.",
  },
  {
    question: "Y a-t-il un engagement ?",
    answer:
      "Aucun. Tu peux annuler ton abonnement à tout moment. Tes données restent accessibles et exportables.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
};

export default function HomePage() {
  return (
    <div className="bg-background text-foreground relative min-h-screen overflow-x-clip">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <LandingHeader />

      <main className="pt-20">
        {/* 1. Hero */}
        <HeroSection />

        <div className="[contain-intrinsic-size:auto_900px] [content-visibility:auto]">
          <FeaturesSection />
        </div>

        <div className="[contain-intrinsic-size:auto_900px] [content-visibility:auto]">
          <BeforeAfterSection />
        </div>

        <div className="[contain-intrinsic-size:auto_900px] [content-visibility:auto]">
          <WorkflowSection />
        </div>

        <div className="[contain-intrinsic-size:auto_900px] [content-visibility:auto]">
          <ProductSuitesSection />
        </div>

        <div className="[contain-intrinsic-size:auto_900px] [content-visibility:auto]">
          <UseCasesSection />
        </div>

        <div className="[contain-intrinsic-size:auto_600px] [content-visibility:auto]">
          <TrustSection />
        </div>

        <div className="[contain-intrinsic-size:auto_1200px] [content-visibility:auto]">
          <section id="pricing">
            <Pricing entryPoint="landing" />
            <div className="mx-auto w-full max-w-7xl px-4 pb-14 lg:px-8 lg:pb-20">
              <PricingComparisonTable />
            </div>
          </section>
        </div>

        <div className="[contain-intrinsic-size:auto_900px] [content-visibility:auto]">
          <FaqSection faqs={faqs} />
        </div>

        <div className="[contain-intrinsic-size:auto_600px] [content-visibility:auto]">
          <NewsletterSection />
        </div>

        <div className="[contain-intrinsic-size:auto_600px] [content-visibility:auto]">
          <FinalCtaSection />
        </div>
      </main>

      <Footer alignWithLandingHeader />
    </div>
  );
}
