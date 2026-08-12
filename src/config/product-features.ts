export type ProductFeatureStatus = "internal" | "beta" | "ga";

export type ProductFeatureKey =
  | "today"
  | "pipeline"
  | "opportunityDiscovery"
  | "followUps"
  | "cv"
  | "contacts"
  | "notifications"
  | "analytics"
  | "calendar"
  | "sequences"
  | "emails"
  | "profiles"
  | "platforms"
  | "programmes"
  | "generalAssistant"
  | "templates"
  | "freelanceAdmin";

type ProductFeature = {
  status: ProductFeatureStatus;
  description: string;
};

export const PRODUCT_FEATURES = {
  today: {
    status: "beta",
    description: "Priorités quotidiennes et prochaine action.",
  },
  pipeline: {
    status: "beta",
    description: "Suivi des missions en Kanban et en liste.",
  },
  opportunityDiscovery: {
    status: "beta",
    description:
      "Radar de missions sourcées, qualifiées et validées avant ajout au pipeline.",
  },
  followUps: {
    status: "beta",
    description: "Relances, snooze et prévention de sur-sollicitation.",
  },
  cv: {
    status: "beta",
    description: "Profil maître, variantes, aperçu A4 et export.",
  },
  contacts: {
    status: "beta",
    description: "CRM léger relié aux missions et relances.",
  },
  notifications: {
    status: "beta",
    description: "Notifications contextuelles sans destination principale.",
  },
  analytics: {
    status: "beta",
    description: "Indicateurs et historique de performance commerciale.",
  },
  calendar: {
    status: "beta",
    description: "Vue calendrier des actions et relances.",
  },
  sequences: {
    status: "beta",
    description: "Séquences de relances structurées.",
  },
  emails: {
    status: "beta",
    description: "Emails de prospection reliés aux missions et contacts.",
  },
  profiles: {
    status: "beta",
    description: "Positionnements commerciaux reliés aux CV.",
  },
  platforms: {
    status: "beta",
    description: "Suivi des plateformes de missions freelance.",
  },
  programmes: {
    status: "beta",
    description: "Programmes LinkedIn gratuits et achats à vie.",
  },
  generalAssistant: {
    status: "beta",
    description: "Copilote contextualisé par les données Jobio.",
  },
  templates: {
    status: "beta",
    description: "Modèles réutilisables depuis les parcours métier.",
  },
  freelanceAdmin: {
    status: "beta",
    description: "Gestion des devis, factures, paiements et activité.",
  },
} as const satisfies Record<ProductFeatureKey, ProductFeature>;

export const NEW_SUBSCRIPTION_PLANS = ["pro"] as const;

const ROUTE_FEATURES = [
  ["/job/cv-lab/coach", "generalAssistant"],
  ["/job/opportunities", "opportunityDiscovery"],
  ["/job/notifications", "notifications"],
  ["/job/follow-ups", "followUps"],
  ["/job/cv-studio", "cv"],
  ["/job/cv-lab", "cv"],
  ["/job/pipeline", "pipeline"],
  ["/job/contacts", "contacts"],
  ["/job/analytics", "analytics"],
  ["/job/calendar", "calendar"],
  ["/job/sequences", "sequences"],
  ["/job/emails", "emails"],
  ["/job/profiles", "profiles"],
  ["/job/platforms", "platforms"],
  ["/job/programmes", "programmes"],
  ["/job/ai", "generalAssistant"],
  ["/job/templates", "templates"],
  ["/job/gestion", "freelanceAdmin"],
  ["/freelance", "freelanceAdmin"],
  ["/job", "today"],
] as const satisfies readonly (readonly [string, ProductFeatureKey])[];

export function isProductFeatureVisible(feature: ProductFeatureKey) {
  const status = PRODUCT_FEATURES[feature].status as ProductFeatureStatus;
  return status !== "internal";
}

export function getProductFeatureForPath(pathname: string) {
  return ROUTE_FEATURES.find(
    ([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )?.[1];
}

export function isProductPathAvailable(pathname: string) {
  const feature = getProductFeatureForPath(pathname);
  return feature ? isProductFeatureVisible(feature) : true;
}

export function isPlanAvailableForNewSubscription(plan: string) {
  return NEW_SUBSCRIPTION_PLANS.includes(
    plan as (typeof NEW_SUBSCRIPTION_PLANS)[number],
  );
}
