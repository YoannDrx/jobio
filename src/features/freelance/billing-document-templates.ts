export const DEFAULT_BILLING_DOCUMENT_PRIMARY_COLOR = "#06b6d4";
export const DEFAULT_BILLING_DOCUMENT_ACCENT_COLOR = "#cffafe";
export const DEFAULT_BILLING_DOCUMENT_TEMPLATE_ID = "jobio-octamy" as const;

export const BILLING_DOCUMENT_TEMPLATE_IDS = [
  "jobio-octamy",
  "ocean-wave",
  "cobalt-frame",
  "terra-editorial",
  "mint-ledger",
  "midnight-glass",
  "coral-ribbon",
  "plum-column",
  "amber-grid",
  "stone-minimal",
] as const;

export type BillingDocumentTemplateId =
  (typeof BILLING_DOCUMENT_TEMPLATE_IDS)[number];

export type BillingDocumentTemplateDefinition = {
  id: BillingDocumentTemplateId;
  label: string;
  mood: string;
  primaryColor: string;
  accentColor: string;
  fontFamily: string;
  headerLayout: "split" | "stacked" | "compact";
  bannerStyle: "none" | "soft-wave" | "geo" | "ribbon";
};

export const BILLING_DOCUMENT_TEMPLATES: readonly BillingDocumentTemplateDefinition[] =
  [
    {
      id: "jobio-octamy",
      label: "Jobio Octamy",
      mood: "Brand minimal premium",
      primaryColor: "#06b6d4",
      accentColor: "#cffafe",
      fontFamily: "'Instrument Sans', 'Segoe UI', sans-serif",
      headerLayout: "split",
      bannerStyle: "none",
    },
    {
      id: "ocean-wave",
      label: "Ocean Wave",
      mood: "Soft gradient and curves",
      primaryColor: "#2563eb",
      accentColor: "#dbeafe",
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      headerLayout: "split",
      bannerStyle: "soft-wave",
    },
    {
      id: "cobalt-frame",
      label: "Cobalt Frame",
      mood: "Strong frame and contrast",
      primaryColor: "#1e40af",
      accentColor: "#bfdbfe",
      fontFamily: "'Archivo', 'Segoe UI', sans-serif",
      headerLayout: "compact",
      bannerStyle: "geo",
    },
    {
      id: "terra-editorial",
      label: "Terra Editorial",
      mood: "Magazine inspired",
      primaryColor: "#9a3412",
      accentColor: "#ffedd5",
      fontFamily: "'Merriweather Sans', 'Segoe UI', sans-serif",
      headerLayout: "stacked",
      bannerStyle: "ribbon",
    },
    {
      id: "mint-ledger",
      label: "Mint Ledger",
      mood: "Accounting and clarity",
      primaryColor: "#047857",
      accentColor: "#d1fae5",
      fontFamily: "'Space Grotesk', 'Segoe UI', sans-serif",
      headerLayout: "compact",
      bannerStyle: "none",
    },
    {
      id: "midnight-glass",
      label: "Midnight Glass",
      mood: "Dark navy contrast",
      primaryColor: "#0f172a",
      accentColor: "#cbd5e1",
      fontFamily: "'Sora', 'Segoe UI', sans-serif",
      headerLayout: "split",
      bannerStyle: "soft-wave",
    },
    {
      id: "coral-ribbon",
      label: "Coral Ribbon",
      mood: "Warm and modern",
      primaryColor: "#e11d48",
      accentColor: "#ffe4e6",
      fontFamily: "'Manrope', 'Segoe UI', sans-serif",
      headerLayout: "stacked",
      bannerStyle: "ribbon",
    },
    {
      id: "plum-column",
      label: "Plum Column",
      mood: "Elegant document",
      primaryColor: "#6d28d9",
      accentColor: "#ede9fe",
      fontFamily: "'Plus Jakarta Sans', 'Segoe UI', sans-serif",
      headerLayout: "compact",
      bannerStyle: "geo",
    },
    {
      id: "amber-grid",
      label: "Amber Grid",
      mood: "Energetic yet clean",
      primaryColor: "#b45309",
      accentColor: "#fef3c7",
      fontFamily: "'Outfit', 'Segoe UI', sans-serif",
      headerLayout: "split",
      bannerStyle: "geo",
    },
    {
      id: "stone-minimal",
      label: "Stone Minimal",
      mood: "Neutral and executive",
      primaryColor: "#334155",
      accentColor: "#e2e8f0",
      fontFamily: "'IBM Plex Sans', 'Segoe UI', sans-serif",
      headerLayout: "compact",
      bannerStyle: "none",
    },
  ] as const;

export const BILLING_DOCUMENT_TEMPLATES_MAP: Record<
  BillingDocumentTemplateId,
  BillingDocumentTemplateDefinition
> = BILLING_DOCUMENT_TEMPLATES.reduce(
  (accumulator, template) => {
    accumulator[template.id] = template;
    return accumulator;
  },
  {} as Record<BillingDocumentTemplateId, BillingDocumentTemplateDefinition>,
);

export const resolveBillingDocumentTemplate = (
  value?: string | null,
): BillingDocumentTemplateDefinition => {
  if (!value) {
    return BILLING_DOCUMENT_TEMPLATES_MAP[DEFAULT_BILLING_DOCUMENT_TEMPLATE_ID];
  }

  if (value in BILLING_DOCUMENT_TEMPLATES_MAP) {
    return BILLING_DOCUMENT_TEMPLATES_MAP[value as BillingDocumentTemplateId];
  }

  return BILLING_DOCUMENT_TEMPLATES_MAP[DEFAULT_BILLING_DOCUMENT_TEMPLATE_ID];
};
