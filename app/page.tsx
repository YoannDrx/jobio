import { LandingHeader } from "@/features/landing/landing-header";
import { NewsletterSection } from "@/features/landing/newsletter-section";
import { BeforeAfterSection } from "@/features/landing/sections/before-after-section";
import { FeaturesSection } from "@/features/landing/sections/features-section";
import { HeroSection } from "@/features/landing/sections/hero-section";
import { MetricsSection } from "@/features/landing/sections/metrics-section";
import { PlatformLogosSection } from "@/features/landing/sections/platform-logos-section";
import { ProductSuitesSection } from "@/features/landing/sections/product-suites-section";
import { TestimonialsSection } from "@/features/landing/sections/testimonials-section";
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
    email: "hello@jobio.fr",
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
  {
    question: "Comment Jobio protège mes données ?",
    answer:
      "Tes données sont hébergées en Europe sur des serveurs conformes RGPD. Tu peux exporter ou supprimer tes données à tout moment depuis les paramètres.",
  },
  {
    question: "Puis-je connecter Jobio à mes outils ?",
    answer:
      "Jobio fonctionne en standalone. Tu importes tes missions par URL ou copier-coller, sans intégration complexe à configurer.",
  },
  {
    question: "Quelle différence entre Pro et Ultra ?",
    answer:
      "Pro couvre l'essentiel : pipeline étendu, séquences automatiques et analytics avancés. Ultra ajoute le coaching IA, les capacités illimitées et un support prioritaire.",
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
    <div className="bg-background text-foreground relative min-h-screen overflow-x-hidden">
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

        {/* 2. Platform logos (marquee) */}
        <PlatformLogosSection />

        {/* 3. Features (4 piliers) */}
        <FeaturesSection />

        {/* 4. Avant / Après */}
        <BeforeAfterSection />

        {/* 5. Workflow (timeline) */}
        <WorkflowSection />

        {/* 6. Product Suites (tabs) */}
        <ProductSuitesSection />

        {/* 7. Métriques (compteurs animés) */}
        <MetricsSection />

        {/* 8. Use Cases */}
        <UseCasesSection />

        {/* 9. Témoignages */}
        <TestimonialsSection />

        {/* 10. Trust Badges */}
        <TrustSection />

        {/* 11. Pricing */}
        <section id="pricing">
          <Pricing entryPoint="landing" />
          <div className="mx-auto w-full max-w-7xl px-4 pb-14 lg:px-8 lg:pb-20">
            <PricingComparisonTable />
          </div>
        </section>

        {/* 12. FAQ (split layout) */}
        <FaqSection faqs={faqs} />

        {/* 13. Newsletter */}
        <NewsletterSection />

        {/* 14. Final CTA */}
        <FinalCtaSection />
      </main>

      <Footer alignWithLandingHeader />
    </div>
  );
}
