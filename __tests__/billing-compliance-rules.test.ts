import {
  buildBillingComplianceChecklist,
  resolveBillingCompliancePreset,
} from "@/features/freelance/billing-compliance-rules";
import { BillingDeclarationPeriodType } from "@/generated/prisma";
import { describe, expect, it } from "vitest";

describe("billing-compliance-rules", () => {
  it("uses activity-specific preset for micro-entreprise", () => {
    const preset = resolveBillingCompliancePreset({
      freelanceStatus: "MICRO_ENTREPRISE",
      activityCategory: "VENTE",
    });

    expect(preset.defaultDeclarationType).toBe(
      BillingDeclarationPeriodType.QUARTERLY,
    );
    expect(preset.defaultContributionRatePercent).toBe(12.3);
    expect(preset.vatExemptionSuggestedText).toContain("293 B");
  });

  it("uses default preset for non-micro statuses", () => {
    const preset = resolveBillingCompliancePreset({
      freelanceStatus: "SASU",
      activityCategory: "SERVICES",
    });

    expect(preset.defaultDeclarationType).toBe(
      BillingDeclarationPeriodType.MONTHLY,
    );
    expect(preset.defaultContributionRatePercent).toBe(70);
    expect(preset.vatExemptionSuggestedText).toBeNull();
  });

  it("builds checklist with required VAT and bank details conditions", () => {
    const checklist = buildBillingComplianceChecklist({
      freelanceStatus: "SASU",
      legalName: "Studio Example",
      legalForm: "SASU",
      siret: "12345678900011",
      addressLine1: "10 rue de Paris",
      postalCode: "75001",
      city: "Paris",
      countryCode: "FR",
      vatNumber: null,
      vatExemptionMention: null,
      iban: null,
      bic: null,
      documentShowBankDetails: true,
    });

    const vatIdentity = checklist.find((item) => item.id === "vat_identity");
    const bankDetails = checklist.find((item) => item.id === "bank_details");

    expect(vatIdentity).toEqual(
      expect.objectContaining({
        required: true,
        ok: false,
      }),
    );
    expect(bankDetails).toEqual(
      expect.objectContaining({
        required: true,
        ok: false,
      }),
    );
  });
});
