import type { Subscription } from "@/generated/prisma";
import { logger } from "@/lib/logger";
import {
  Bot,
  Briefcase,
  ChartBar,
  Clock,
  Contact,
  HeadphonesIcon,
  Monitor,
  Shield,
  UserCircle,
  Zap,
} from "lucide-react";

const DEFAULT_LIMIT = {
  missions: 50,
  profiles: 3,
  contacts: 20,
  platforms: 3,
  aiRequestsPerMonth: 20,
  analyticsHistoryDays: 7,
};

export type PlanLimit = typeof DEFAULT_LIMIT;

export type OverrideLimits = Partial<PlanLimit>;

type HookCtx = {
  req: Request;
  userId: string;
  stripeCustomerId: string;
  subscriptionId: string;
};

export type AppAuthPlan = {
  priceId?: string | undefined;
  lookupKey?: string | undefined;
  annualDiscountPriceId?: string | undefined;
  annualDiscountLookupKey?: string | undefined;
  name: string;
  limits?: Record<string, number> | undefined;
  group?: string;
  freeTrial?: {
    days: number;
    onTrialStart?: (subscription: Subscription, ctx: HookCtx) => Promise<void>;
    onTrialEnd?: (
      data: {
        subscription: Subscription;
      },
      ctx: HookCtx,
    ) => Promise<void>;
    onTrialExpired?: (
      subscription: Subscription,
      ctx: HookCtx,
    ) => Promise<void>;
  };
  onSubscriptionCanceled?: (
    subscription: Subscription,
    ctx: HookCtx,
  ) => Promise<void>;
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
      "Pour commencer a organiser sa prospection freelance gratuitement",
    limits: DEFAULT_LIMIT,
    price: 0,
    currency: "EUR",
    yearlyPrice: 0,
  },
  {
    name: "pro",
    isPopular: true,
    description:
      "Pour les freelances actifs qui veulent maximiser leur prospection",
    priceId: process.env.STRIPE_PRO_PLAN_ID ?? "",
    annualDiscountPriceId: process.env.STRIPE_PRO_YEARLY_PLAN_ID ?? "",
    limits: {
      missions: 999999,
      profiles: 10,
      contacts: 999999,
      platforms: 999999,
      aiRequestsPerMonth: 200,
      analyticsHistoryDays: 90,
    },
    freeTrial: {
      days: 14,
      onTrialStart: async (subscription) => {
        logger.debug(`Welcome email sent to ${subscription}`);
      },
      onTrialExpired: async (subscription) => {
        logger.debug(`Trial expired for ${subscription}`);
      },
      onTrialEnd: async (subscription) => {
        logger.debug(`Trial ended for ${subscription}`);
      },
    },
    price: 9.99,
    yearlyPrice: 99,
    currency: "EUR",
  },
  {
    name: "ultra",
    isPopular: false,
    description:
      "Pour les freelances exigeants avec acces illimite et IA avancee",
    priceId: process.env.STRIPE_ULTRA_PLAN_ID ?? "",
    annualDiscountPriceId: process.env.STRIPE_ULTRA_YEARLY_PLAN_ID ?? "",
    limits: {
      missions: 999999,
      profiles: 999999,
      contacts: 999999,
      platforms: 999999,
      aiRequestsPerMonth: 999,
      analyticsHistoryDays: 999999,
    },
    freeTrial: {
      days: 14,
    },
    price: 19.99,
    yearlyPrice: 199,
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
      value >= 999999 ? "Missions illimitees" : `${value} missions`,
    description: "Suivre et gerer vos missions freelance",
  },
  profiles: {
    icon: UserCircle,
    getLabel: (value: number) =>
      value >= 999999 ? "Profils illimites" : `${value} profils`,
    description: "Creer des profils pour differentes specialisations",
  },
  contacts: {
    icon: Contact,
    getLabel: (value: number) =>
      value >= 999999 ? "Contacts illimites" : `${value} contacts`,
    description: "Gerer votre reseau de contacts professionnels",
  },
  platforms: {
    icon: Monitor,
    getLabel: (value: number) =>
      value >= 999999 ? "Plateformes illimitees" : `${value} plateformes`,
    description: "Connecter vos plateformes de freelance",
  },
  aiRequestsPerMonth: {
    icon: Bot,
    getLabel: (value: number) =>
      value >= 999999
        ? "Requetes IA illimitees"
        : `${value} requetes IA/mois`,
    description: "Assistants IA pour optimiser votre prospection",
  },
  analyticsHistoryDays: {
    icon: ChartBar,
    getLabel: (value: number) =>
      value >= 999999
        ? "Historique analytics illimite"
        : `${value} jours d'historique analytics`,
    description: "Analyser vos performances de prospection",
  },
};

// Additional features by plan
export const ADDITIONAL_FEATURES = {
  free: [
    {
      icon: Shield,
      label: "Securite de base",
      description: "Protection standard de vos donnees",
    },
  ],
  pro: [
    {
      icon: Zap,
      label: "Support prioritaire",
      description: "Assistance rapide quand vous en avez besoin",
    },
    {
      icon: HeadphonesIcon,
      label: "Support email",
      description: "Assistance par email",
    },
    {
      icon: Clock,
      label: "Analytics avances",
      description: "Statistiques detaillees de votre prospection",
    },
  ],
  ultra: [
    {
      icon: Zap,
      label: "Support prioritaire",
      description: "Assistance en priorite",
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
