import { Badge } from "@/components/ui/badge";
import { BreadcrumbStructuredData } from "@/components/seo/breadcrumb-structured-data";
import { SiteConfig } from "@/site-config";
import {
  PublicPageShell,
  PublicSection,
} from "@/features/layout/public-page-shell";
import { buildMarketingMetadata } from "@/lib/seo";
import { Compass, Goal, ShieldCheck, Sparkles, Wrench } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = buildMarketingMetadata({
  title: `À propos | ${SiteConfig.title}`,
  description:
    "Découvrez la mission de Jobio: aider les freelances tech à piloter leur prospection avec méthode, clarté et vitesse.",
  path: "/about",
});

const valueCards = [
  {
    icon: Goal,
    title: "Focus résultat",
    text: "Chaque écran doit aider à signer une mission, pas juste à stocker de l'information.",
  },
  {
    icon: Compass,
    title: "Clarté opérationnelle",
    text: "Un freelance doit savoir quoi faire aujourd'hui sans ouvrir 12 onglets.",
  },
  {
    icon: Wrench,
    title: "Automation utile",
    text: "L'IA et les séquences doivent gagner du temps sans dégrader la qualité des échanges.",
  },
  {
    icon: ShieldCheck,
    title: "Confiance et contrôle",
    text: "Tes données t'appartiennent. Export, suppression et paramétrage restent simples et accessibles.",
  },
];

const milestones = [
  {
    quarter: "Q1 2026",
    title: "Noyau CRM freelance",
    details:
      "Pipeline, contacts, relances, profils et scoring IA pour structurer la prospection de base.",
  },
  {
    quarter: "Q2 2026",
    title: "Cockpit de performance",
    details:
      "Analytics métier, notifications actionnables et optimisation du cycle mission -> proposition -> accepté.",
  },
  {
    quarter: "Q3 2026",
    title: "Collaboration et opérations",
    details:
      "Partage, routines d'équipe freelance et pilotage admin renforcé pour monitorer le produit en continu.",
  },
];

export default function AboutPage() {
  return (
    <>
      <BreadcrumbStructuredData
        items={[
          { name: "Accueil", path: "/" },
          { name: "À propos", path: "/about" },
        ]}
      />
      <PublicPageShell
        badge="À propos de Jobio"
        title="Un cockpit commercial construit pour les freelances tech."
        description="Jobio est né d'un constat simple: la prospection freelance est souvent gérée entre Notion, mails, rappels, feuilles de calcul et mémoire personnelle. On construit un outil unique qui remet de l'ordre et accélère la conversion."
        highlights={[
          "Produit orienté action",
          "Roadmap active",
          "Approche pragmatique",
        ]}
      >
        <div className="grid w-full gap-4 lg:grid-cols-3">
          <PublicSection
            title="Notre mission"
            description="Rendre la prospection prévisible, mesurable et plus sereine."
            className="lg:col-span-2"
          >
            <p className="text-muted-foreground leading-relaxed">
              Nous aidons les freelances à passer d&apos;une prospection
              opportuniste à un système commercial reproductible. La priorité
              n&apos;est pas d&apos;ajouter des fonctionnalités décoratives,
              mais de donner une vision claire: où en sont les missions, quelles
              relances faire, et comment améliorer le taux de conversion.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border p-4">
                <p className="text-sm font-medium">Pour l&apos;utilisateur</p>
                <p className="text-muted-foreground mt-1 text-sm">
                  Moins de friction opérationnelle, plus de temps sur les
                  actions à forte valeur.
                </p>
              </div>
              <div className="rounded-xl border p-4">
                <p className="text-sm font-medium">Pour le business</p>
                <p className="text-muted-foreground mt-1 text-sm">
                  Un meilleur pilotage du pipeline, des relances plus régulières
                  et une meilleure vitesse de conversion.
                </p>
              </div>
            </div>
          </PublicSection>

          <PublicSection title="Ce qu'on optimise" description="Au quotidien">
            <ul className="space-y-2 text-sm">
              <li className="rounded-lg border p-3">
                Priorisation des missions
              </li>
              <li className="rounded-lg border p-3">
                Qualité et régularité des relances
              </li>
              <li className="rounded-lg border p-3">
                Visibilité sur les performances
              </li>
              <li className="rounded-lg border p-3">
                Capacité à apprendre de ses données
              </li>
            </ul>
          </PublicSection>
        </div>

        <PublicSection
          title="Nos principes produit"
          description="Des décisions guidées par l'impact utilisateur."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {valueCards.map((item) => (
              <div key={item.title} className="rounded-xl border p-4">
                <div className="mb-2 flex items-center gap-2">
                  <item.icon className="text-primary size-4" />
                  <p className="font-medium">{item.title}</p>
                </div>
                <p className="text-muted-foreground text-sm">{item.text}</p>
              </div>
            ))}
          </div>
        </PublicSection>

        <PublicSection
          title="Roadmap produit"
          description="Une trajectoire orientée exécution."
        >
          <div className="space-y-3">
            {milestones.map((item) => (
              <div
                key={item.title}
                className="flex flex-col gap-2 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-muted-foreground text-sm">
                    {item.details}
                  </p>
                </div>
                <Badge variant="secondary" className="w-fit">
                  {item.quarter}
                </Badge>
              </div>
            ))}
          </div>
        </PublicSection>

        <PublicSection
          title="Contact équipe"
          description="Tu veux contribuer avec des retours terrain ?"
        >
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={`mailto:${SiteConfig.supportEmail}`}
              className="hover:text-primary text-sm font-medium transition-colors"
            >
              {SiteConfig.supportEmail}
            </a>
            <span className="text-muted-foreground text-sm">
              • Réponse en général sous 24h ouvrées
            </span>
            <Sparkles className="text-primary size-4" />
          </div>
        </PublicSection>
      </PublicPageShell>
    </>
  );
}
