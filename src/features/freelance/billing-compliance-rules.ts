import type { BillingDeclarationPeriodType } from "@/generated/prisma";

export const FREELANCE_STATUS_VALUES = [
  "MICRO_ENTREPRISE",
  "EI",
  "EURL",
  "SASU",
  "SAS",
  "SA",
  "PORTAGE",
  "AUTRE",
] as const;

export type FreelanceStatus = (typeof FREELANCE_STATUS_VALUES)[number];

export const ACTIVITY_CATEGORY_VALUES = [
  "SERVICES",
  "LIBERAL",
  "VENTE",
] as const;

export type ActivityCategory = (typeof ACTIVITY_CATEGORY_VALUES)[number];

export type BillingCompliancePreset = {
  statusLabel: string;
  defaultDeclarationType: BillingDeclarationPeriodType;
  defaultContributionRatePercent: number;
  vatExemptionSuggestedText: string | null;
  notes: string[];
};

type ComplianceInput = {
  freelanceStatus?: string | null;
  activityCategory?: string | null;
};

type ComplianceChecklistInput = ComplianceInput & {
  legalName?: string | null;
  legalForm?: string | null;
  siret?: string | null;
  addressLine1?: string | null;
  postalCode?: string | null;
  city?: string | null;
  countryCode?: string | null;
  email?: string | null;
  vatNumber?: string | null;
  vatExemptionMention?: string | null;
  iban?: string | null;
  bic?: string | null;
  documentShowBankDetails?: boolean | null;
};

export type BillingComplianceChecklistItem = {
  id: string;
  label: string;
  ok: boolean;
  required: boolean;
};

const PRESET_BY_STATUS: Record<FreelanceStatus, BillingCompliancePreset> = {
  MICRO_ENTREPRISE: {
    statusLabel: "Micro-entreprise",
    defaultDeclarationType: "QUARTERLY",
    defaultContributionRatePercent: 23.1,
    vatExemptionSuggestedText: "TVA non applicable, art. 293 B du CGI",
    notes: [
      "Taux à ajuster selon activité (vente/services/libéral).",
      "Pense à afficher la mention de franchise TVA si non assujetti.",
    ],
  },
  EI: {
    statusLabel: "Entreprise individuelle",
    defaultDeclarationType: "MONTHLY",
    defaultContributionRatePercent: 45,
    vatExemptionSuggestedText: null,
    notes: [
      "Le taux varie selon bénéfice réel et options fiscales.",
      "Vérifie la TVA collectée et déductible selon ton régime.",
    ],
  },
  EURL: {
    statusLabel: "EURL",
    defaultDeclarationType: "MONTHLY",
    defaultContributionRatePercent: 45,
    vatExemptionSuggestedText: null,
    notes: [
      "Le dirigeant TNS a des cotisations distinctes du régime assimilé salarié.",
    ],
  },
  SASU: {
    statusLabel: "SASU",
    defaultDeclarationType: "MONTHLY",
    defaultContributionRatePercent: 70,
    vatExemptionSuggestedText: null,
    notes: [
      "Estimation prudente pour rémunération assimilée salarié.",
      "Le coût social dépend fortement du niveau de salaire.",
    ],
  },
  SAS: {
    statusLabel: "SAS",
    defaultDeclarationType: "MONTHLY",
    defaultContributionRatePercent: 70,
    vatExemptionSuggestedText: null,
    notes: [
      "Estimation prudente pour structures à président assimilé salarié.",
    ],
  },
  SA: {
    statusLabel: "SA",
    defaultDeclarationType: "MONTHLY",
    defaultContributionRatePercent: 70,
    vatExemptionSuggestedText: null,
    notes: ["Affiner selon politique de rémunération et charges patronales."],
  },
  PORTAGE: {
    statusLabel: "Portage salarial",
    defaultDeclarationType: "MONTHLY",
    defaultContributionRatePercent: 50,
    vatExemptionSuggestedText: null,
    notes: [
      "Le coût global dépend des frais de gestion de la société de portage.",
    ],
  },
  AUTRE: {
    statusLabel: "Autre statut",
    defaultDeclarationType: "QUARTERLY",
    defaultContributionRatePercent: 25,
    vatExemptionSuggestedText: null,
    notes: [
      "Renseigne manuellement ton taux réel pour des projections fiables.",
    ],
  },
};

const MICRO_RATE_BY_ACTIVITY: Record<ActivityCategory, number> = {
  SERVICES: 21.2,
  LIBERAL: 23.1,
  VENTE: 12.3,
};

export const freelanceStatusLabel: Record<FreelanceStatus, string> =
  FREELANCE_STATUS_VALUES.reduce(
    (acc, status) => {
      acc[status] = PRESET_BY_STATUS[status].statusLabel;
      return acc;
    },
    {} as Record<FreelanceStatus, string>,
  );

export const activityCategoryLabel: Record<ActivityCategory, string> = {
  SERVICES: "Prestations de services",
  LIBERAL: "Profession libérale",
  VENTE: "Vente de marchandises",
};

export const parseFreelanceStatus = (value: string | null | undefined) => {
  if (!value) {
    return null;
  }

  return FREELANCE_STATUS_VALUES.includes(value as FreelanceStatus)
    ? (value as FreelanceStatus)
    : null;
};

export const parseActivityCategory = (value: string | null | undefined) => {
  if (!value) {
    return null;
  }

  return ACTIVITY_CATEGORY_VALUES.includes(value as ActivityCategory)
    ? (value as ActivityCategory)
    : null;
};

export const resolveBillingCompliancePreset = (
  input: ComplianceInput,
): BillingCompliancePreset => {
  const status =
    parseFreelanceStatus(input.freelanceStatus) ?? "MICRO_ENTREPRISE";
  const activity = parseActivityCategory(input.activityCategory);
  const base = PRESET_BY_STATUS[status];

  if (status !== "MICRO_ENTREPRISE" || !activity) {
    return base;
  }

  return {
    ...base,
    defaultContributionRatePercent: MICRO_RATE_BY_ACTIVITY[activity],
  };
};

const hasText = (value: string | null | undefined) =>
  Boolean(value && value.trim().length > 0);

export const buildBillingComplianceChecklist = (
  input: ComplianceChecklistInput,
): BillingComplianceChecklistItem[] => {
  const status = parseFreelanceStatus(input.freelanceStatus);
  const requiresCompanyShape =
    status === "SASU" ||
    status === "SAS" ||
    status === "SA" ||
    status === "EURL";
  const requiresVatIdentity = status !== "MICRO_ENTREPRISE";
  const shouldShowBank = input.documentShowBankDetails ?? true;

  return [
    {
      id: "legal_name",
      label: "Raison sociale renseignée",
      ok: hasText(input.legalName),
      required: true,
    },
    {
      id: "address",
      label: "Adresse légale complète",
      ok:
        hasText(input.addressLine1) &&
        hasText(input.postalCode) &&
        hasText(input.city) &&
        hasText(input.countryCode),
      required: true,
    },
    {
      id: "siret",
      label: "SIRET renseigné",
      ok: hasText(input.siret),
      required: true,
    },
    {
      id: "legal_form",
      label: "Forme juridique",
      ok: hasText(input.legalForm),
      required: requiresCompanyShape,
    },
    {
      id: "contact_email",
      label: "Email de facturation",
      ok: hasText(input.email),
      required: false,
    },
    {
      id: "vat_identity",
      label: "TVA (numéro ou mention d'exonération)",
      ok: hasText(input.vatNumber) || hasText(input.vatExemptionMention),
      required: requiresVatIdentity,
    },
    {
      id: "bank_details",
      label: "Coordonnées bancaires (IBAN/BIC)",
      ok: hasText(input.iban) && hasText(input.bic),
      required: shouldShowBank,
    },
  ];
};
