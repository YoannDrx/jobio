import { FAQSection } from "@/features/landing/faq-section";
import { FeaturesSection } from "@/features/landing/feature-section";
import { Hero } from "@/features/landing/hero";
import { LandingHeader } from "@/features/landing/landing-header";
import { PromisesSection } from "@/features/landing/promises-section";
import { SectionDivider } from "@/features/landing/section-divider";
import { StatsSection } from "@/features/landing/stats-section";
import { Footer } from "@/features/layout/footer";
import { Pricing } from "@/features/plans/pricing-section";
import Image from "next/image";

export default function HomePage() {
  return (
    <div className="bg-background text-foreground relative flex h-fit flex-col">
      <div className="mt-16"></div>

      <LandingHeader />

      <Hero />

      <StatsSection />

      <PromisesSection />

      <SectionDivider />

      <FeaturesSection
        features={[
          {
            badge: "🎯 Scoring IA",
            title: "Scoring intelligent des missions",
            description:
              "Chaque mission reçoit un score 0-100 en fonction de ton profil, TJM cible et préférences. Priorise ce qui te convient vraiment.",
            component: (
              <Image
                src="/images/placeholder1.gif"
                alt="Scoring IA"
                width={200}
                height={100}
                className="h-auto w-full object-cover"
                unoptimized
              />
            ),
          },
          {
            badge: "📋 Kanban",
            title: "Pipeline visuel",
            description:
              "Organise tes prospects : Lead, Qualifié, Proposé, Gagné. Vue d'ensemble complète de ton pipeline.",
            component: (
              <Image
                src="/images/placeholder1.gif"
                alt="Kanban"
                width={200}
                height={100}
                className="h-auto w-full object-cover"
              />
            ),
          },
          {
            badge: "⏰ Séquences",
            title: "Relances automatiques",
            description:
              "Crée tes séquences de relance personnalisées. Fini les deals oubliés, plus de conversions perdues.",
            component: (
              <Image
                src="/images/placeholder1.gif"
                alt="Séquences"
                width={200}
                height={100}
                className="h-auto w-full object-cover"
                unoptimized
              />
            ),
          },
          {
            badge: "📊 Analytics",
            title: "Dashboards puissants",
            description:
              "TJM moyen, taux de conversion par plateforme, cycle de vente... Toutes les données qui t'importent.",
            component: (
              <Image
                src="/images/placeholder1.gif"
                alt="Analytics"
                width={200}
                height={100}
                className="h-auto w-full object-cover"
                unoptimized
              />
            ),
          },
        ]}
      />

      <SectionDivider />

      <Pricing />

      <FAQSection
        faq={[
          {
            question: "C'est quoi Jobio ?",
            answer:
              "Jobio est un cockpit commercial conçu spécifiquement pour les freelances tech. Il t'aide à organiser ta prospection, suivre tes missions dans un Kanban visuel, et ne jamais oublier une relance grâce aux séquences automatiques.",
          },
          {
            question: "Comment fonctionne le scoring IA ?",
            answer:
              "Quand tu ajoutes une mission (par URL ou texte), notre IA analyse l'annonce et la compare à ton profil : compétences, TJM cible, préférences de travail. Chaque mission reçoit un score de 0 à 100 pour t'aider à prioriser.",
          },
          {
            question: "Quelles plateformes sont supportées ?",
            answer:
              "Jobio supporte les principales plateformes freelance : Malt, Comet, Free-Work, Crème de la Crème, Upwork, LinkedIn, et bien d'autres. Tu peux aussi ajouter des missions manuellement.",
          },
          {
            question: "Est-ce gratuit ?",
            answer:
              "Oui ! Le plan Free te donne accès à 15 missions, 2 profils, 30 contacts et 5 requêtes IA par mois. Pour débloquer toutes les fonctionnalités, passe en Pro à 9,99€/mois.",
          },
          {
            question: "Mes données sont-elles sécurisées ?",
            answer:
              "Absolument. Tes données sont hébergées en Europe, chiffrées en transit et au repos. Nous ne partageons jamais tes informations avec des tiers.",
          },
          {
            question: "Puis-je importer mon profil LinkedIn ?",
            answer:
              "Oui ! Colle simplement le texte de ton profil LinkedIn et notre IA extraira automatiquement tes compétences, ton expérience et ton headline pour créer ton profil Jobio.",
          },
        ]}
      />

      <SectionDivider />

      <Footer />
    </div>
  );
}
