export const PRICING_EXPERIMENT_VARIANTS = [
  "control",
  "value_stack",
  "roi_focus",
] as const;

export type PricingExperimentVariant =
  (typeof PRICING_EXPERIMENT_VARIANTS)[number];

export const PRICING_EXPERIMENT_STORAGE_KEY = "jobio_pricing_experiment_variant";
export const PRICING_EXPERIMENT_QUERY_PARAM = "pv";
export const DEFAULT_PRICING_EXPERIMENT_VARIANT: PricingExperimentVariant =
  "control";

export const pricingExperimentVariantLabels: Record<
  PricingExperimentVariant,
  string
> = {
  control: "Contrôle",
  value_stack: "Valeur complète",
  roi_focus: "ROI rapide",
};

export const normalizePricingExperimentVariant = (
  value: string | null | undefined,
): PricingExperimentVariant | null => {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  return (PRICING_EXPERIMENT_VARIANTS as readonly string[]).includes(normalized)
    ? (normalized as PricingExperimentVariant)
    : null;
};

