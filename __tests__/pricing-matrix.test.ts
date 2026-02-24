import { PRICING_COMPARISON_CATEGORIES } from "@/features/plans/pricing-matrix";
import { getPlanLimits } from "@/lib/auth/stripe/auth-plans";
import type { PlanLimit } from "@/lib/auth/stripe/auth-plans";
import { describe, expect, it } from "vitest";

const UNLIMITED_THRESHOLD = 999_999;

const findFeatureByName = (name: string) => {
  for (const category of PRICING_COMPARISON_CATEGORIES) {
    const feature = category.features.find((item) => item.name === name);
    if (feature) return feature;
  }

  throw new Error(`Feature not found in pricing matrix: ${name}`);
};

const asCount = (value: number): string =>
  value >= UNLIMITED_THRESHOLD ? "Illimité" : value.toString();

const asBoolean = (value: number): boolean => value >= 1;

const asCvTemplate = (value: number): string => (value >= 1 ? "Tous" : "Classic");

const asAnalyticsHistory = (value: number): string =>
  value >= UNLIMITED_THRESHOLD ? "Illimité" : `${value} jours`;

describe("pricing matrix", () => {
  it("maps plan limits to comparison rows", () => {
    const free = getPlanLimits("free");
    const pro = getPlanLimits("pro");
    const ultra = getPlanLimits("ultra");

    const checks: {
      name: string;
      key: keyof PlanLimit;
      format: (value: number) => string | boolean;
    }[] = [
      { name: "Missions", key: "missions", format: asCount },
      { name: "Profils", key: "profiles", format: asCount },
      { name: "Contacts", key: "contacts", format: asCount },
      { name: "Plateformes", key: "platforms", format: asCount },
      { name: "Entreprises", key: "companies", format: asCount },
      { name: "Documents CV", key: "cvDocuments", format: asCount },
      { name: "Templates", key: "cvTemplatesAll", format: asCvTemplate },
      { name: "ATS Scoring", key: "atsScoring", format: asBoolean },
      { name: "CV Coach IA", key: "cvCoachAI", format: asBoolean },
      { name: "Relances auto", key: "autoFollowUps", format: asBoolean },
      { name: "Séquences", key: "sequences", format: asCount },
      { name: "Templates messages", key: "messageTemplates", format: asCount },
      { name: "Export CSV", key: "csvExport", format: asBoolean },
      { name: "Clients", key: "billingClients", format: asCount },
      { name: "Devis", key: "billingQuotes", format: asCount },
      { name: "Factures", key: "billingInvoices", format: asCount },
      { name: "Catalogue", key: "billingCatalogItems", format: asCount },
      { name: "Requêtes/mois", key: "aiRequestsPerMonth", format: asCount },
      { name: "Génération emails", key: "aiEmailGeneration", format: asBoolean },
      { name: "LinkedIn Audit", key: "aiLinkedinAudit", format: asBoolean },
      {
        name: "Historique",
        key: "analyticsHistoryDays",
        format: asAnalyticsHistory,
      },
    ];

    for (const check of checks) {
      const feature = findFeatureByName(check.name);
      expect(feature.free).toBe(check.format(free[check.key]));
      expect(feature.pro).toBe(check.format(pro[check.key]));
      expect(feature.ultra).toBe(check.format(ultra[check.key]));
    }
  });

  it("keeps support labels explicit by plan", () => {
    const feature = findFeatureByName("Type");

    expect(feature.free).toBe("Communautaire");
    expect(feature.pro).toBe("Email prioritaire");
    expect(feature.ultra).toBe("Chat prioritaire");
  });
});
