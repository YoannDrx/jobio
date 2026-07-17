export type ProductFeatureStatus = "active" | "beta" | "hidden";

export type ProductFeatureKey =
  | "today"
  | "pipeline"
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
    status: "active",
    description: "Priorités quotidiennes et prochaine action.",
  },
  pipeline: {
    status: "active",
    description: "Suivi des missions en Kanban et en liste.",
  },
  followUps: {
    status: "active",
    description: "Relances, snooze et prévention de sur-sollicitation.",
  },
  cv: {
    status: "active",
    description: "Profil maître, variantes, aperçu A4 et export.",
  },
  contacts: {
    status: "active",
    description: "CRM léger relié aux missions et relances.",
  },
  notifications: {
    status: "active",
    description: "Notifications contextuelles sans destination principale.",
  },
  analytics: {
    status: "hidden",
    description: "Les indicateurs seront réintégrés dans les écrans métier.",
  },
  calendar: {
    status: "hidden",
    description: "Le calendrier sera fusionné dans Relances.",
  },
  sequences: {
    status: "hidden",
    description: "Les séquences seront fusionnées dans Relances.",
  },
  emails: {
    status: "hidden",
    description: "Module hors du périmètre Jobio V1.",
  },
  profiles: {
    status: "hidden",
    description: "Les profils seront absorbés par CV.",
  },
  platforms: {
    status: "hidden",
    description: "Module hors du périmètre Jobio V1.",
  },
  programmes: {
    status: "hidden",
    description: "Module hors du périmètre Jobio V1.",
  },
  generalAssistant: {
    status: "hidden",
    description: "Assistant IA généraliste hors du périmètre Jobio V1.",
  },
  templates: {
    status: "hidden",
    description: "Les modèles seront exposés depuis leur contexte métier.",
  },
  freelanceAdmin: {
    status: "hidden",
    description: "Administration freelance est archivé avant migration ciblée.",
  },
} as const satisfies Record<ProductFeatureKey, ProductFeature>;

export const NEW_SUBSCRIPTION_PLANS = ["pro"] as const;

const ROUTE_FEATURES = [
  ["/job/cv-lab/coach", "generalAssistant"],
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
  ["/freelance", "freelanceAdmin"],
  ["/job", "today"],
] as const satisfies readonly (readonly [string, ProductFeatureKey])[];

export function isProductFeatureVisible(feature: ProductFeatureKey) {
  return PRODUCT_FEATURES[feature].status !== "hidden";
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
