import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BreadcrumbStructuredData } from "@/components/seo/breadcrumb-structured-data";
import { PublicPageShell, PublicSection } from "@/features/layout/public-page-shell";
import { RelatedResourcesSection } from "@/features/layout/related-resources-section";
import {
  formatPlanCount,
  getPlanSupportLabel,
} from "@/features/plans/plan-copy";
import { getPlanLimits } from "@/lib/auth/stripe/auth-plans";
import { buildMarketingMetadata } from "@/lib/seo";
import { SiteConfig } from "@/site-config";
import {
  Bot,
  CheckCircle2,
  Compass,
  FileCode2,
  Gauge,
  ListChecks,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = buildMarketingMetadata({
  title: `Docs | ${SiteConfig.title}`,
  description:
    "Documentation produit Jobio: démarrage, workflows recommandés et bonnes pratiques de prospection.",
  path: "/docs",
});

const quickStart = [
  {
    title: "1. Créer ton profil freelance",
    details:
      "Ajoute ton headline, tes compétences et ton TJM cible. Le scoring IA devient immédiatement plus pertinent.",
  },
  {
    title: "2. Configurer tes plateformes",
    details:
      "Renseigne les plateformes que tu utilises. Tu pourras mesurer leur performance dans Analytics.",
  },
  {
    title: "3. Capturer tes premières missions",
    details:
      "Utilise le quick capture (URL ou texte) pour transformer une annonce en mission structurée.",
  },
  {
    title: "4. Activer les relances",
    details:
      "Crée des séquences puis applique-les dès qu'une mission passe en statut POSTULÉ.",
  },
];

const workflows = [
  {
    icon: Compass,
    title: "Pipeline quotidien",
    steps: [
      "Revue de la page Today",
      "Traitement des relances en retard",
      "Mise à jour des statuts de mission",
      "Décision: relancer, archiver, ou pousser en proposition",
    ],
  },
  {
    icon: Bot,
    title: "Workflow IA",
    steps: [
      "Parser une mission depuis URL",
      "Vérifier l'extraction (TJM, stack, localisation)",
      "Créer une candidature/email avec l'assistant",
      "Tracer l'envoi et la réponse dans Jobio",
    ],
  },
  {
    icon: Gauge,
    title: "Pilotage performance",
    steps: [
      "Comparer la conversion par plateforme",
      "Observer la vitesse de cycle",
      "Identifier les statuts bloquants",
      "Adapter séquences et templates",
    ],
  },
];

const relatedResources = [
  {
    href: "/features" as const,
    title: "Cartographie des fonctionnalités",
    description:
      "Visualise rapidement tout ce que Jobio couvre: pipeline, IA, CV Studio et billing.",
    ctaLabel: "Voir les fonctionnalités",
  },
  {
    href: "/blog" as const,
    title: "Playbooks freelance",
    description:
      "Passe de la théorie à la pratique avec des guides prospection et négociation.",
    ctaLabel: "Lire les articles",
  },
  {
    href: "/#pricing" as const,
    title: "Choisir le bon plan",
    description:
      "Aligne ton volume d'usage avec les limites Free, Pro et Ultra.",
    ctaLabel: "Comparer les plans",
  },
];

const freePlanLimits = getPlanLimits("free");
const proPlanLimits = getPlanLimits("pro");
const ultraPlanLimits = getPlanLimits("ultra");

const planSummaryCards = [
  {
    name: "Free",
    summary: `${formatPlanCount(freePlanLimits.missions)} missions · ${formatPlanCount(freePlanLimits.contacts)} contacts · ${formatPlanCount(freePlanLimits.aiRequestsPerMonth)} requêtes IA/mois`,
    support: getPlanSupportLabel("free"),
  },
  {
    name: "Pro",
    summary: `${formatPlanCount(proPlanLimits.missions)} missions · ${formatPlanCount(proPlanLimits.contacts)} contacts · ${formatPlanCount(proPlanLimits.aiRequestsPerMonth)} requêtes IA/mois`,
    support: getPlanSupportLabel("pro"),
  },
  {
    name: "Ultra",
    summary: `${formatPlanCount(ultraPlanLimits.missions)} missions · ${formatPlanCount(ultraPlanLimits.contacts)} contacts · ${formatPlanCount(ultraPlanLimits.aiRequestsPerMonth)} requêtes IA/mois`,
    support: getPlanSupportLabel("ultra"),
  },
];

export default function DocsPage() {
  const howToJsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "Démarrage rapide Jobio",
    description:
      "Mise en place de Jobio pour structurer la prospection freelance en moins de 15 minutes.",
    totalTime: "PT15M",
    step: quickStart.map((item) => ({
      "@type": "HowToStep",
      name: item.title.replace(/^\d+\.\s*/, ""),
      text: item.details,
    })),
  };

  return (
    <>
      <BreadcrumbStructuredData
        items={[
          { name: "Accueil", path: "/" },
          { name: "Documentation", path: "/docs" },
        ]}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
      />
      <PublicPageShell
        badge="Documentation"
        title="Mode d'emploi opérationnel de Jobio."
        description="Cette documentation est orientée terrain: comment structurer ton flux de prospection, éviter les oublis de relance et améliorer ton taux de signature."
        lastUpdated="11 février 2026"
        highlights={[
          "Guide rapide de démarrage",
          "Workflows recommandés",
          "Bonnes pratiques conversion",
        ]}
      >
      <div className="grid w-full gap-4 lg:grid-cols-3">
        <PublicSection
          title="Démarrage rapide"
          description="Les 4 étapes pour être opérationnel en moins de 15 minutes."
          className="lg:col-span-2"
        >
          <div className="space-y-3">
            {quickStart.map((step) => (
              <div key={step.title} className="rounded-xl border p-4">
                <p className="font-medium">{step.title}</p>
                <p className="text-muted-foreground mt-1 text-sm">
                  {step.details}
                </p>
              </div>
            ))}
          </div>
        </PublicSection>

        <PublicSection title="Navigation utile" description="Raccourcis clés">
          <div className="space-y-2 text-sm">
            <Badge variant="secondary" className="w-fit">
              /job
            </Badge>
            <p className="text-muted-foreground">
              Today: priorités du jour, relances urgentes, signaux importants.
            </p>
            <Badge variant="secondary" className="w-fit">
              /job/pipeline
            </Badge>
            <p className="text-muted-foreground">
              Vue Kanban/Liste pour piloter toutes tes missions.
            </p>
            <Badge variant="secondary" className="w-fit">
              /job/analytics
            </Badge>
            <p className="text-muted-foreground">
              Lecture performance: conversion, TJM, forecast.
            </p>
          </div>
        </PublicSection>
      </div>

      <PublicSection
        title="Workflows recommandés"
        description="Cadres d'exécution concrets pour éviter la dispersion."
      >
        <div className="grid gap-3 md:grid-cols-3">
          {workflows.map((flow) => (
            <div key={flow.title} className="rounded-xl border p-4">
              <div className="mb-3 flex items-center gap-2">
                <flow.icon className="text-primary size-4" />
                <p className="font-medium">{flow.title}</p>
              </div>
              <ul className="space-y-2 text-sm">
                {flow.steps.map((step) => (
                  <li key={step} className="flex items-start gap-2">
                    <CheckCircle2 className="text-primary mt-0.5 size-3.5 shrink-0" />
                    <span className="text-muted-foreground">{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </PublicSection>

      <div className="grid w-full gap-4 lg:grid-cols-2">
        <PublicSection
          title="Extension & capture"
          description="Jobio expose une API interne pour la capture rapide (utilisée par l'extension Chrome)."
        >
          <div className="space-y-3 text-sm">
            <div className="rounded-xl border p-3">
              <p className="mb-1 font-medium">Endpoint parsing</p>
              <code className="text-muted-foreground text-xs">
                POST /api/extension/capture
              </code>
            </div>
            <div className="rounded-xl border p-3">
              <p className="mb-1 font-medium">Endpoint création mission</p>
              <code className="text-muted-foreground text-xs">
                POST /api/extension/missions
              </code>
            </div>
            <p className="text-muted-foreground">
              Ces endpoints exigent une session authentifiée et respectent les
              limites de plan.
            </p>
          </div>
        </PublicSection>

        <PublicSection
          title="Bonnes pratiques IA"
          description="Pour améliorer la qualité des suggestions."
        >
          <ul className="space-y-2 text-sm">
            <li className="rounded-lg border p-3">
              Renseigne un profil par spécialité (backend, data, product...).
            </li>
            <li className="rounded-lg border p-3">
              Nettoie la description importée avant génération d'email.
            </li>
            <li className="rounded-lg border p-3">
              Garde des templates courts et concrets pour les relances.
            </li>
            <li className="rounded-lg border p-3">
              Vérifie systématiquement le ton et les variables avant envoi.
            </li>
          </ul>
        </PublicSection>
      </div>

      <PublicSection
        title="Besoin d'aide supplémentaire ?"
        description="Si tu bloques sur ton setup ou un comportement produit."
      >
        <div className="flex flex-wrap items-center gap-3">
          <Button asChild size="sm">
            <Link href="/contact">Contacter le support</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/legal/terms">Lire les CGU</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/legal/privacy">Voir la confidentialité</Link>
          </Button>
          <div className="text-muted-foreground ml-auto flex items-center gap-2 text-xs">
            <FileCode2 className="size-3.5" />
            <span>Docs version produit 2026.02</span>
          </div>
        </div>
      </PublicSection>

      <PublicSection
        title="Limites de plan (résumé)"
        description="Extrait des plafonds actuels pour guider les usages."
      >
        <div className="grid gap-3 sm:grid-cols-3">
          {planSummaryCards.map((card) => (
            <div key={card.name} className="rounded-xl border p-4">
              <p className="font-medium">{card.name}</p>
              <p className="text-muted-foreground mt-1 text-sm">
                {card.summary}
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                Support: {card.support}
              </p>
            </div>
          ))}
        </div>
        <div className="text-muted-foreground mt-3 flex items-center gap-2 text-xs">
          <ListChecks className="size-3.5" />
          Vérifie toujours les limites live dans la sidebar de ton espace
          connecté.
        </div>
      </PublicSection>

      <PublicSection title="Changelog docs" description="Historique des mises à jour">
        <div className="space-y-2 text-sm">
          <div className="rounded-lg border p-3">
            <p className="font-medium">11 février 2026</p>
            <p className="text-muted-foreground">
              Publication de la documentation publique initiale (démarrage,
              workflows, API capture, bonnes pratiques IA).
            </p>
          </div>
          <div className="text-muted-foreground flex items-center gap-2 text-xs">
            <Sparkles className="size-3.5" />
            Cette page évolue au rythme des nouvelles features.
          </div>
        </div>
      </PublicSection>
      <RelatedResourcesSection
        title="Ressources complémentaires"
        description="Continue ton onboarding avec les pages les plus utiles."
        resources={relatedResources}
        className="mt-4"
      />
      </PublicPageShell>
    </>
  );
}
