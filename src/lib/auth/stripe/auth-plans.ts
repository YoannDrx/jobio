import {
  BookText,
  Bot,
  Building2,
  Briefcase,
  ChartBar,
  Contact,
  Download,
  FileClock,
  FileText,
  HeadphonesIcon,
  ListOrdered,
  Mail,
  MessageSquare,
  Monitor,
  Palette,
  Receipt,
  RefreshCw,
  Search,
  Shield,
  Target,
  UserCircle,
  Wand2,
} from "lucide-react";

export const DEFAULT_LIMIT = {
  missions: 15,
  profiles: 2,
  contacts: 30,
  platforms: 3,
  companies: 10,
  billingClients: 3,
  billingQuotes: 5,
  billingInvoices: 5,
  billingCatalogItems: 5,
  billingRecurringInvoices: 0,
  aiRequestsPerMonth: 5,
  analyticsHistoryDays: 30,
  cvDocuments: 1,
  cvTemplatesAll: 0,
  cvCoachAI: 0,
  atsScoring: 0,
  autoFollowUps: 0,
  sequences: 0,
  messageTemplates: 3,
  csvExport: 1,
  aiEmailGeneration: 0,
  aiLinkedinAudit: 0,
  opportunityDiscovery: 0,
};

export type PlanLimit = typeof DEFAULT_LIMIT;
export const PLAN_LIMIT_KEYS = Object.keys(
  DEFAULT_LIMIT,
) as (keyof PlanLimit)[];

export type OverrideLimits = Partial<PlanLimit>;

export type AppAuthPlan = {
  priceId?: string | undefined;
  lookupKey?: string | undefined;
  annualDiscountPriceId?: string | undefined;
  annualDiscountLookupKey?: string | undefined;
  name: string;
  limits?: Record<string, number> | undefined;
  group?: string;
  freeTrial?: { days: number };
} & {
  description: string;
  isPopular?: boolean;
  price: number;
  yearlyPrice?: number;
  currency: string;
  isHidden?: boolean;
  limits: PlanLimit;
};

export const AUTH_PLANS: AppAuthPlan[] = [
  {
    name: "free",
    description:
      "Pour commencer à organiser sa prospection freelance gratuitement",
    limits: DEFAULT_LIMIT,
    price: 0,
    currency: "EUR",
    yearlyPrice: 0,
  },
  {
    name: "pro",
    isPopular: true,
    description:
      "Le cockpit complet pour prospecter, candidater et piloter son activité",
    priceId: process.env.STRIPE_PRO_PLAN_ID ?? "",
    lookupKey: "jobio_pro_monthly_v1",
    annualDiscountPriceId: process.env.STRIPE_PRO_YEARLY_PLAN_ID ?? "",
    annualDiscountLookupKey: "jobio_pro_yearly_v1",
    freeTrial: { days: 14 },
    limits: {
      missions: 999999,
      profiles: 10,
      contacts: 1000,
      platforms: 999999,
      companies: 500,
      billingClients: 999999,
      billingQuotes: 999999,
      billingInvoices: 999999,
      billingCatalogItems: 999999,
      billingRecurringInvoices: 50,
      aiRequestsPerMonth: 100,
      analyticsHistoryDays: 999999,
      cvDocuments: 20,
      cvTemplatesAll: 1,
      cvCoachAI: 1,
      atsScoring: 1,
      autoFollowUps: 1,
      sequences: 20,
      messageTemplates: 100,
      csvExport: 1,
      aiEmailGeneration: 1,
      aiLinkedinAudit: 1,
      opportunityDiscovery: 1,
    },
    price: 19,
    yearlyPrice: 190,
    currency: "EUR",
  },
];

// Limits transformation object
export const LIMITS_CONFIG: Record<
  keyof PlanLimit,
  {
    icon: React.ElementType;
    getLabel: (value: number) => string;
    description: string;
  }
> = {
  missions: {
    icon: Briefcase,
    getLabel: (value: number) =>
      value >= 999999 ? "Missions illimitées" : `${value} missions`,
    description: "Suivre et gérer vos missions freelance",
  },
  profiles: {
    icon: UserCircle,
    getLabel: (value: number) =>
      value >= 999999 ? "Profils illimités" : `${value} profils`,
    description: "Créer des profils pour différentes spécialisations",
  },
  contacts: {
    icon: Contact,
    getLabel: (value: number) =>
      value >= 999999 ? "Contacts illimités" : `${value} contacts`,
    description: "Gérer votre réseau de contacts professionnels",
  },
  platforms: {
    icon: Monitor,
    getLabel: (value: number) =>
      value >= 999999 ? "Plateformes illimitées" : `${value} plateformes`,
    description: "Connecter vos plateformes de freelance",
  },
  companies: {
    icon: Building2,
    getLabel: (value: number) =>
      value >= 999999 ? "Entreprises illimitées" : `${value} entreprises`,
    description: "Suivre les entreprises que vous démarchez",
  },
  billingClients: {
    icon: Contact,
    getLabel: (value: number) =>
      value >= 999999
        ? "Clients facturation illimités"
        : `${value} clients facturation`,
    description: "Créer et gérer votre base clients de facturation",
  },
  billingQuotes: {
    icon: FileClock,
    getLabel: (value: number) =>
      value >= 999999 ? "Devis illimités" : `${value} devis`,
    description: "Émettre et suivre vos devis",
  },
  billingInvoices: {
    icon: Receipt,
    getLabel: (value: number) =>
      value >= 999999 ? "Factures illimitées" : `${value} factures`,
    description: "Générer et suivre vos factures clients",
  },
  billingCatalogItems: {
    icon: BookText,
    getLabel: (value: number) =>
      value >= 999999 ? "Catalogue illimité" : `${value} éléments catalogue`,
    description: "Maintenir un catalogue de prestations réutilisables",
  },
  billingRecurringInvoices: {
    icon: RefreshCw,
    getLabel: (value: number) =>
      value >= 999999
        ? "Factures récurrentes illimitées"
        : `${value} factures récurrentes`,
    description: "Automatiser la génération de factures périodiques",
  },
  aiRequestsPerMonth: {
    icon: Bot,
    getLabel: (value: number) =>
      value >= 999999 ? "Requêtes IA illimitées" : `${value} requêtes IA/mois`,
    description: "Assistants IA pour optimiser votre prospection",
  },
  analyticsHistoryDays: {
    icon: ChartBar,
    getLabel: (value: number) =>
      value >= 999999
        ? "Historique analytics illimité"
        : `${value} jours d'historique analytics`,
    description: "Analyser vos performances de prospection",
  },
  cvDocuments: {
    icon: FileText,
    getLabel: (value: number) =>
      value >= 999999
        ? "Documents CV illimités"
        : `${value} document${value > 1 ? "s" : ""} CV`,
    description: "Créer et personnaliser vos CV",
  },
  cvTemplatesAll: {
    icon: Palette,
    getLabel: (value: number) =>
      value >= 1 ? "Tous les templates CV" : "Template Classic uniquement",
    description: "Accéder à tous les designs de CV",
  },
  cvCoachAI: {
    icon: MessageSquare,
    getLabel: (value: number) =>
      value >= 1 ? "CV Coach IA personnel" : "CV Coach IA non inclus",
    description: "Assistant IA pour optimiser votre CV",
  },
  atsScoring: {
    icon: Target,
    getLabel: (value: number) =>
      value >= 1 ? "ATS Scoring CV" : "ATS Scoring non inclus",
    description: "Analyser la compatibilité ATS de votre CV",
  },
  autoFollowUps: {
    icon: RefreshCw,
    getLabel: (value: number) =>
      value >= 1 ? "Relances automatiques" : "Relances manuelles uniquement",
    description: "Automatiser vos relances de prospection",
  },
  sequences: {
    icon: ListOrdered,
    getLabel: (value: number) =>
      value >= 999999
        ? "Séquences illimitées"
        : value === 0
          ? "Pas de séquences"
          : `${value} séquences`,
    description: "Créer des séquences de relances automatisées",
  },
  messageTemplates: {
    icon: Mail,
    getLabel: (value: number) =>
      value >= 999999
        ? "Templates messages illimités"
        : `${value} templates messages`,
    description: "Modèles de messages réutilisables",
  },
  csvExport: {
    icon: Download,
    getLabel: (value: number) =>
      value >= 1 ? "Export CSV" : "Export CSV non inclus",
    description: "Exporter vos données en CSV",
  },
  aiEmailGeneration: {
    icon: Wand2,
    getLabel: (value: number) =>
      value >= 1 ? "Génération emails IA" : "Génération emails IA non incluse",
    description: "Générer des emails personnalisés avec l'IA",
  },
  aiLinkedinAudit: {
    icon: Search,
    getLabel: (value: number) =>
      value >= 1 ? "LinkedIn Audit IA" : "LinkedIn Audit IA non inclus",
    description: "Auditer et optimiser votre profil LinkedIn",
  },
  opportunityDiscovery: {
    icon: Search,
    getLabel: (value: number) =>
      value >= 1 ? "Radar Missions IA" : "Radar Missions non inclus",
    description: "Découvrir et qualifier des missions avant candidature",
  },
};

// Additional features by plan (features not covered by numeric limits)
export const ADDITIONAL_FEATURES = {
  free: [
    {
      icon: Shield,
      label: "Pipeline de base",
      description: "Organise ta prospection freelance",
    },
    {
      icon: HeadphonesIcon,
      label: "Support communautaire",
      description: "Aide via la communauté",
    },
  ],
  pro: [
    {
      icon: HeadphonesIcon,
      label: "Support email prioritaire",
      description: "Assistance rapide par email",
    },
  ],
};

export const getPlanLimits = (
  plan = "free",
  overrideLimits?: OverrideLimits | null,
): PlanLimit => {
  const planLimits = AUTH_PLANS.find((p) => p.name === plan)?.limits;

  const baseLimits = planLimits ?? DEFAULT_LIMIT;

  if (!overrideLimits) {
    return baseLimits;
  }

  return {
    ...baseLimits,
    ...overrideLimits,
  };
};

export const getPlanFeatures = (plan: AppAuthPlan): string[] => {
  const features: string[] = [
    ...Object.entries(plan.limits)
      .filter(([key]) => key in LIMITS_CONFIG)
      .map(([key, value]) => {
        const limitConfig = LIMITS_CONFIG[key as keyof typeof LIMITS_CONFIG];
        return limitConfig.getLabel(value as number);
      }),
    ...ADDITIONAL_FEATURES[plan.name as keyof typeof ADDITIONAL_FEATURES].map(
      (f) => f.label,
    ),
  ];
  return features;
};
