import {
  PublicPageShell,
  PublicSection,
} from "@/features/layout/public-page-shell";
import { buildMarketingMetadata } from "@/lib/seo";
import { SiteConfig } from "@/site-config";
import {
  BarChart3,
  Bell,
  CalendarCheck,
  Check,
  Globe,
  Kanban,
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
      "Vue Kanban drag & drop avec colonnes personnalisables",
      "Capture rapide de missions avec parsing IA",
      "Scoring automatique des opportunites",
      "Filtres avances et export CSV",
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
      "5 types de relances configurables",
      "Snooze et report en un clic",
      "Sequences de relance automatisees",
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
      "Generation d'emails de prospection personnalises",
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

export default function FeaturesPage() {
  return (
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
    </PublicPageShell>
  );
}
