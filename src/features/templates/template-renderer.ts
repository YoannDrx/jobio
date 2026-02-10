type TemplateContext = {
  mission?: {
    title: string;
    company: string | null;
    tjm: number | null;
    duration: string | null;
    location: string | null;
    workType: string | null;
    stack: string[];
  };
  contact?: {
    firstName: string;
    lastName: string;
    company: string | null;
    role: string | null;
  };
  profile?: {
    headline: string | null;
    tjmTarget: number | null;
  };
};

/**
 * Remplace les variables {{variable}} dans le template par les valeurs du contexte.
 * Supporte les chemins imbriqués comme {{mission.title}}, {{contact.firstName}}, etc.
 */
export function renderTemplate(
  template: string,
  context: TemplateContext,
): string {
  let rendered = template;

  const replacements: Record<string, string> = {
    "{{mission.title}}": context.mission?.title ?? "",
    "{{mission.company}}": context.mission?.company ?? "",
    "{{mission.tjm}}": context.mission?.tjm ? `${context.mission.tjm}€/j` : "",
    "{{mission.duration}}": context.mission?.duration ?? "",
    "{{mission.location}}": context.mission?.location ?? "",
    "{{mission.workType}}": context.mission?.workType ?? "",
    "{{mission.stack}}": context.mission?.stack.join(", ") ?? "",
    "{{contact.firstName}}": context.contact?.firstName ?? "",
    "{{contact.lastName}}": context.contact?.lastName ?? "",
    "{{contact.fullName}}": context.contact
      ? `${context.contact.firstName} ${context.contact.lastName}`
      : "",
    "{{contact.company}}": context.contact?.company ?? "",
    "{{contact.role}}": context.contact?.role ?? "",
    "{{profile.headline}}": context.profile?.headline ?? "",
    "{{profile.tjmTarget}}": context.profile?.tjmTarget
      ? `${context.profile.tjmTarget}€/j`
      : "",
  };

  for (const [key, value] of Object.entries(replacements)) {
    rendered = rendered.replaceAll(key, value);
  }

  return rendered;
}

export const TEMPLATE_VARIABLES = [
  {
    category: "Mission",
    variables: [
      {
        name: "mission.title",
        description: "Titre de la mission",
        example: "Dev React Senior",
      },
      {
        name: "mission.company",
        description: "Entreprise",
        example: "Acme Corp",
      },
      { name: "mission.tjm", description: "TJM proposé", example: "550€/j" },
      {
        name: "mission.duration",
        description: "Durée de la mission",
        example: "6 mois",
      },
      {
        name: "mission.location",
        description: "Localisation",
        example: "Paris",
      },
      {
        name: "mission.workType",
        description: "Type de travail",
        example: "Hybride",
      },
      {
        name: "mission.stack",
        description: "Stack technique",
        example: "React, TypeScript, Node.js",
      },
    ],
  },
  {
    category: "Contact",
    variables: [
      {
        name: "contact.firstName",
        description: "Prénom du contact",
        example: "Marie",
      },
      {
        name: "contact.lastName",
        description: "Nom du contact",
        example: "Dupont",
      },
      {
        name: "contact.fullName",
        description: "Nom complet",
        example: "Marie Dupont",
      },
      {
        name: "contact.company",
        description: "Entreprise du contact",
        example: "Acme Corp",
      },
      {
        name: "contact.role",
        description: "Rôle du contact",
        example: "Recruteuse",
      },
    ],
  },
  {
    category: "Profil",
    variables: [
      {
        name: "profile.headline",
        description: "Titre du profil",
        example: "Développeur Full-Stack",
      },
      {
        name: "profile.tjmTarget",
        description: "TJM cible",
        example: "600€/j",
      },
    ],
  },
] as const;

export type { TemplateContext };
