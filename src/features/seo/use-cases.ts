import { absoluteUrl } from "@/lib/seo";

export type JobioUseCase = {
  slug: string;
  persona: string;
  title: string;
  description: string;
  summary: string;
  recommendedPlan: "free" | "pro";
  experimentVariant: "control" | "value_stack" | "roi_focus";
  keywords: string[];
  painPoints: string[];
  outcomes: string[];
  workflowSteps: string[];
  featureHighlights: {
    title: string;
    description: string;
    href: `/${string}` | "/";
  }[];
  faq: {
    question: string;
    answer: string;
  }[];
};

export const JOBIO_USE_CASES: JobioUseCase[] = [
  {
    slug: "developpeur-freelance",
    persona: "Développeur freelance",
    title:
      "Structurer sa prospection développeur freelance sans perdre de temps",
    description:
      "Pipeline missions, relances automatisées, CV ciblés et pilotage de conversion pour les développeurs freelance.",
    summary:
      "Tu centralises missions, contacts et relances pour convertir plus régulièrement sans multiplier les outils.",
    recommendedPlan: "pro",
    experimentVariant: "roi_focus",
    keywords: [
      "developpeur freelance",
      "prospection developpeur freelance",
      "crm freelance developpeur",
      "trouver missions developpeur freelance",
    ],
    painPoints: [
      "Suivi des candidatures dispersé entre emails, Notion et tableurs.",
      "Relances oubliées ou envoyées trop tard.",
      "Difficulté à savoir quelles plateformes convertissent vraiment.",
    ],
    outcomes: [
      "Un pipeline unique pour visualiser les opportunités en cours.",
      "Des relances planifiées avec séquences prêtes à l’emploi.",
      "Des analytics actionnables pour concentrer l’effort sur les canaux rentables.",
    ],
    workflowSteps: [
      "Capture de mission (URL ou texte) et parsing IA.",
      "Qualification par score + adéquation stack/TJM.",
      "Candidature personnalisée puis relances cadencées.",
      "Analyse conversion et optimisation hebdomadaire.",
    ],
    featureHighlights: [
      {
        title: "Pipeline missions + CRM contacts",
        description:
          "Visualise les statuts, centralise les interactions et garde un prochain pas clair.",
        href: "/features",
      },
      {
        title: "Templates et séquences de relance",
        description:
          "Active des relances cohérentes à J+3, J+7, J+14 sans repartir de zéro.",
        href: "/docs",
      },
      {
        title: "Pricing aligné volume",
        description:
          "Commence en Free puis débloque automatisation et IA avancée en Pro.",
        href: "/#pricing",
      },
    ],
    faq: [
      {
        question: "Jobio convient-il si je réponds à 10-20 missions par mois ?",
        answer:
          "Oui. C’est précisément le cas d’usage visé: centraliser la prospection, éviter les oublis et standardiser les relances.",
      },
      {
        question:
          "Puis-je garder plusieurs variantes de CV selon le type de mission ?",
        answer:
          "Oui. Le CV Studio permet de maintenir plusieurs documents et de les ajuster selon la mission cible.",
      },
    ],
  },
  {
    slug: "data-ai-freelance",
    persona: "Data / AI freelance",
    title: "Gérer un cycle commercial data/IA freelance orienté valeur",
    description:
      "Priorise les opportunités data/IA, améliore ton positionnement et accélère le passage proposition -> signature.",
    summary:
      "Jobio t’aide à qualifier les briefs data/IA et à montrer ta valeur métier avec un suivi commercial rigoureux.",
    recommendedPlan: "pro",
    experimentVariant: "value_stack",
    keywords: [
      "data freelance",
      "ai freelance",
      "prospection consultant data",
      "missions intelligence artificielle freelance",
    ],
    painPoints: [
      "Briefs clients parfois flous, difficiles à qualifier rapidement.",
      "Cycle de vente plus long avec besoin de preuves et itérations.",
      "Perte de contexte entre échanges techniques et négociation.",
    ],
    outcomes: [
      "Qualification plus fine des missions (enjeu, stack, budget, urgence).",
      "Séquences de relance adaptées aux cycles de décision plus longs.",
      "Vision claire des opportunités à haute valeur pour augmenter le TJM moyen.",
    ],
    workflowSteps: [
      "Import d’un brief et structuration des exigences clés.",
      "Scoring de pertinence et choix de priorité commercial.",
      "Envoi d’une proposition de valeur contextualisée.",
      "Relances pilotées jusqu’à décision finale.",
    ],
    featureHighlights: [
      {
        title: "Scoring + assistants IA",
        description:
          "Identifie vite les missions à fort potentiel et génère des messages adaptés au contexte.",
        href: "/features",
      },
      {
        title: "CV Coach IA + ATS scoring",
        description:
          "Optimise le positionnement de ton profil sur les appels d’offres et portails filtrés.",
        href: "/docs",
      },
      {
        title: "Comparaison plans Free/Pro",
        description:
          "Choisis la capacité IA et l’automatisation alignées avec ton volume de prospection.",
        href: "/#pricing",
      },
    ],
    faq: [
      {
        question:
          "Le plan Pro est-il pertinent pour un freelance data/IA solo ?",
        answer:
          "Oui si tu as un volume régulier de candidatures et que tu veux maximiser l’itération IA (CV, messages, qualification).",
      },
      {
        question:
          "Puis-je suivre des cycles de vente longs (plusieurs semaines) ?",
        answer:
          "Oui. Les séquences et l’historique d’interactions permettent de conserver le contexte sur des cycles complexes.",
      },
    ],
  },
  {
    slug: "product-no-code-freelance",
    persona: "Product / No-code freelance",
    title: "Piloter prospection et facturation pour freelances product/no-code",
    description:
      "Passe d’un suivi artisanal à un système complet: acquisition, relance, proposition commerciale et facturation.",
    summary:
      "Jobio relie le commercial et l’administratif pour sécuriser le revenu des freelances product et no-code.",
    recommendedPlan: "pro",
    experimentVariant: "control",
    keywords: [
      "no-code freelance",
      "product freelance",
      "crm freelance no-code",
      "facturation freelance product",
    ],
    painPoints: [
      "Pipeline commercial et facturation gérés dans des outils séparés.",
      "Perte de visibilité entre devis envoyés et signatures.",
      "Difficulté à prioriser entre acquisition, delivery et admin.",
    ],
    outcomes: [
      "Un flux unifié mission -> proposition -> facture.",
      "Un meilleur suivi de la conversion commerciale et des encaissements.",
      "Moins de charge mentale grâce à des processus standardisés.",
    ],
    workflowSteps: [
      "Qualification des leads entrants et scoring d’opportunité.",
      "Suivi du pipeline jusqu’à la proposition commerciale.",
      "Passage en facturation avec suivi paiements.",
      "Revue hebdo performance commerciale + admin.",
    ],
    featureHighlights: [
      {
        title: "Prospection + relances dans le même cockpit",
        description:
          "Tu exécutes ton plan d’acquisition sans perdre le fil des opportunités en cours.",
        href: "/features",
      },
      {
        title: "Freelance Billing intégré",
        description:
          "Gère clients, devis, factures, paiements et registres dans le même environnement.",
        href: "/docs",
      },
      {
        title: "Plans adaptés à la maturité business",
        description:
          "Démarre léger puis active les capacités avancées quand ton volume augmente.",
        href: "/#pricing",
      },
    ],
    faq: [
      {
        question:
          "Jobio peut-il remplacer un combo Notion + tableur + outil de facturation ?",
        answer:
          "Oui dans la majorité des cas freelance: prospection, suivi pipeline et facturation sont couverts nativement.",
      },
      {
        question: "Quel plan choisir pour démarrer ?",
        answer:
          "Le plan Free suffit pour tester le flux. Le plan Pro est généralement le meilleur point d’équilibre pour une activité régulière.",
      },
    ],
  },
];

const bySlug = new Map(JOBIO_USE_CASES.map((item) => [item.slug, item]));

export const getUseCaseBySlug = (slug: string) => bySlug.get(slug) ?? null;

export const getUseCaseCanonicalUrl = (slug: string) =>
  absoluteUrl(`/use-cases/${slug}`);
